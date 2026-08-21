#!/usr/bin/env node
/**
 * Cross-platform local runner (Windows cmd, Git Bash, macOS, Linux).
 * Pull repo updates, apply install/migrations/seed, start the clinic app.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(ROOT);

const WIN = process.platform === "win32";
const PORT = Number.parseInt(process.env.PORT || "3000", 10) || 3000;

function log(message) {
  console.log(`\n==> ${message}`);
}

function warn(message) {
  console.warn(`warning: ${message}`);
}

function needCmd(name) {
  const probe = spawnSync(name, ["--version"], {
    stdio: "ignore",
    shell: WIN,
  });
  if (probe.error || probe.status !== 0) {
    console.error(`Missing required command: ${name}`);
    process.exit(1);
  }
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: WIN,
    env: process.env,
  });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function capture(command, args) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    shell: WIN,
    env: process.env,
  });
  return {
    status: result.status ?? 1,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
  };
}

function runForeground(command, args) {
  const child = spawn(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: WIN,
    env: process.env,
  });
  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 1);
  });
}

export function parseArgs(argv) {
  const args = argv.slice(2);
  let command = "up";
  const flags = {
    pull: true,
    seed: true,
    killPort: false,
  };

  if (args[0] && !args[0].startsWith("-")) {
    command = args.shift();
  }

  for (const arg of args) {
    if (arg === "--no-pull") flags.pull = false;
    else if (arg === "--no-seed") flags.seed = false;
    else if (arg === "--kill-port") flags.killPort = true;
    else if (arg === "-h" || arg === "--help") command = "help";
    else {
      console.error(`Unknown option: ${arg}`);
      console.error("Try: node scripts/local-run.mjs help");
      process.exit(1);
    }
  }

  return { command, flags };
}

function usage() {
  console.log(`Clinic local runner — apply repo updates and run the app.

Usage:
  npm run local                 # pull, install, migrate, seed, start dev
  npm run local:update          # same, without starting the server
  npm run local:dev             # start Next.js only
  npm run local:check           # unit tests + production build
  npm run local:e2e             # update, then Playwright
  node scripts/local-run.mjs <command> [options]

Commands:
  up        Update the checkout, then start next dev (default)
  update    git pull, npm install, migrate, seed
  dev       Start the dev server (creates .env.local if missing)
  check     npm test && next build
  e2e       update, then Playwright
  help      Show this text

Options:
  --no-pull     Skip git pull
  --no-seed     Skip prisma seed
  --kill-port   Free PORT (default 3000) if something is already listening

If npm says Missing script "local", this checkout is not on latest main:
  git checkout main
  git pull origin main

After start:
  http://localhost:${PORT}/he/login
  staff  admin / admin-password
  portal portal / portal-password`);
}

function ensureEnv() {
  const localEnv = path.join(ROOT, ".env.local");
  const example = path.join(ROOT, ".env.example");
  if (!fs.existsSync(localEnv)) {
    if (!fs.existsSync(example)) {
      console.error("No .env.example found; cannot create .env.local");
      process.exit(1);
    }
    log("Creating .env.local from .env.example");
    fs.copyFileSync(example, localEnv);
    return;
  }
  log(".env.local already present");
}

function gitUpdate(doPull) {
  if (!doPull) {
    log("Skipping git pull (--no-pull)");
    return;
  }
  if (!fs.existsSync(path.join(ROOT, ".git"))) {
    warn("Not a git checkout; skip pull");
    return;
  }
  const dirty = capture("git", ["status", "--porcelain"]);
  if (dirty.stdout) {
    warn("Working tree is dirty; skip git pull so local edits are kept");
    run("git", ["status", "-sb"]);
    return;
  }
  const branch = capture("git", ["rev-parse", "--abbrev-ref", "HEAD"]).stdout;
  if (!branch || branch === "HEAD") {
    warn("Detached HEAD; skip git pull");
    return;
  }
  log(`Pulling origin/${branch} (fast-forward only)`);
  const fetched = spawnSync("git", ["fetch", "origin", branch], {
    cwd: ROOT,
    stdio: "inherit",
    shell: WIN,
  });
  if (fetched.status !== 0) {
    warn("git fetch failed; continuing with local files");
    return;
  }
  const remote = capture("git", ["rev-parse", "--verify", `origin/${branch}`]);
  if (remote.status !== 0) {
    warn(`No origin/${branch}; skip pull`);
    return;
  }
  const pulled = spawnSync("git", ["pull", "--ff-only", "origin", branch], {
    cwd: ROOT,
    stdio: "inherit",
    shell: WIN,
  });
  if (pulled.status !== 0) {
    warn("git pull --ff-only failed; continuing");
  }
}

function npmInstall() {
  needCmd("npm");
  log("Installing npm dependencies");
  run("npm", ["install"]);
}

function dbUpdate(doSeed) {
  log("Applying Prisma migrations");
  run("npx", ["prisma", "generate"]);
  run("npx", ["prisma", "migrate", "deploy"]);
  if (doSeed) {
    log("Seeding (idempotent: admin, Test Patient, portal user, assessments)");
    run("npm", ["run", "db:seed"]);
    return;
  }
  log("Skipping seed (--no-seed)");
}

function portInUse() {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(true));
    server.once("listening", () => {
      server.close(() => resolve(false));
    });
    server.listen(PORT, "127.0.0.1");
  });
}

function lineHasPort(line, port) {
  return new RegExp(`[:\\]]${port}(?=\\s|$)`).test(line);
}

function listeningPids() {
  if (WIN) {
    const { stdout } = capture("netstat", ["-ano"]);
    const pids = new Set();
    for (const line of stdout.split(/\r?\n/)) {
      if (!/LISTENING/i.test(line) || !lineHasPort(line, PORT)) continue;
      const pid = line.trim().split(/\s+/).pop();
      if (pid && pid !== "0") pids.add(pid);
    }
    return [...pids];
  }
  const lsof = capture("lsof", ["-t", "-nP", `-iTCP:${PORT}`, "-sTCP:LISTEN"]);
  if (lsof.status !== 0 || !lsof.stdout) return [];
  return lsof.stdout.split(/\s+/).filter(Boolean);
}

async function freePort(killPort) {
  if (!(await portInUse())) return;
  if (!killPort) {
    warn(
      `Port ${PORT} is already in use. Stop that process, or re-run with --kill-port.`
    );
    return;
  }
  log(`Freeing port ${PORT}`);
  for (const pid of listeningPids()) {
    if (WIN) run("taskkill", ["/F", "/PID", pid]);
    else spawnSync("kill", [pid], { stdio: "inherit" });
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

function printReady() {
  console.log(`
Clinic is ready.

  App:    http://localhost:${PORT}/he
  Login:  http://localhost:${PORT}/he/login
  Staff:  admin / admin-password
  Portal: portal / portal-password
`);
}

function runUpdate(flags) {
  ensureEnv();
  gitUpdate(flags.pull);
  npmInstall();
  dbUpdate(flags.seed);
}

async function runDev(flags) {
  ensureEnv();
  await freePort(flags.killPort);
  printReady();
  log(`Starting Next.js (PORT=${PORT})`);
  runForeground("npm", ["run", "dev", "--", "--port", String(PORT)]);
}

function runCheck() {
  needCmd("npm");
  log("Unit tests");
  run("npm", ["test"]);
  log("Production build");
  run("npx", ["next", "build"]);
}

async function main() {
  const { command, flags } = parseArgs(process.argv);
  switch (command) {
    case "help":
    case "-h":
    case "--help":
      usage();
      return;
    case "update":
      runUpdate(flags);
      log("Updates applied. Start with: npm run local:dev");
      return;
    case "dev":
      await runDev(flags);
      return;
    case "up":
      runUpdate(flags);
      await runDev(flags);
      return;
    case "check":
      runCheck();
      return;
    case "e2e":
      runUpdate(flags);
      log("Playwright e2e");
      run("npm", ["run", "e2e"]);
      return;
    default:
      console.error(`Unknown command: ${command}`);
      usage();
      process.exit(1);
  }
}

const invokedDirectly =
  Boolean(process.argv[1]) &&
  path.normalize(path.resolve(process.argv[1])) ===
    path.normalize(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
