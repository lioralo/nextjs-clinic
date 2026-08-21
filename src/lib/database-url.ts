import path from "node:path";

/** Resolve `file:./dev.db` from process.cwd() so Prisma CLI and Next.js share one file. */
export function resolveDatabaseUrl(
  raw = process.env.DATABASE_URL ?? "file:./dev.db"
) {
  if (!raw.startsWith("file:")) return raw;
  const rest = raw.slice("file:".length);
  if (path.isAbsolute(rest)) {
    return `file:${rest.replaceAll("\\", "/")}`;
  }
  return `file:${path.resolve(/* turbopackIgnore: true */ process.cwd(), rest).replaceAll("\\", "/")}`;
}
