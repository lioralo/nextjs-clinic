import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import path from "node:path";
import { defineConfig } from "prisma/config";

function sqliteUrl() {
  const raw = process.env["DATABASE_URL"] ?? "file:./dev.db";
  if (!raw.startsWith("file:")) return raw;
  const rest = raw.slice("file:".length);
  if (path.isAbsolute(rest)) return `file:${rest.replaceAll("\\", "/")}`;
  return `file:${path.resolve(process.cwd(), rest).replaceAll("\\", "/")}`;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: sqliteUrl(),
  },
});
