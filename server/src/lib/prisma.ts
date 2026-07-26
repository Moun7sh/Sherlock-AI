import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const fallbackDatabaseUrl = "postgresql://sherlock:sherlock2026@localhost:5432/sherlock_ai?schema=public";
if (!process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL = fallbackDatabaseUrl;
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    const value = Reflect.get(globalForPrisma.prisma, prop, receiver);
    return typeof value === "function" ? value.bind(globalForPrisma.prisma) : value;
  },
  set(_target, prop, value, receiver) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    return Reflect.set(globalForPrisma.prisma, prop, value, receiver);
  },
});
