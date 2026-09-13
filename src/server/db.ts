import { PrismaClient } from "@prisma/client";

/**
 * The Prisma client singleton.
 *
 * Next's dev server re-evaluates modules on every hot reload, and a fresh
 * `PrismaClient` each time exhausts the database's connection limit within a
 * few edits — hence the global cache in development. Production gets one
 * client per process, which is what we want.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
