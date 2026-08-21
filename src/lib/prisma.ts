import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

import { resolveDatabaseUrl } from "./database-url";

// Prevent creating many PrismaClient instances in dev (Next.js hot reload).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const databaseUrl = resolveDatabaseUrl();

const adapter = new PrismaLibSql({
  url: databaseUrl,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
