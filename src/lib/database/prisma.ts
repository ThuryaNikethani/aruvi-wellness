import { Prisma, PrismaClient } from "@prisma/client";

/**
 * Neon (serverless Postgres) suspends when idle and drops idle connections, and a laptop
 * going to sleep leaves dead sockets in the pool. Give the pool time to wake the database,
 * and retry once or twice when a connection was lost or the pool timed out.
 */
function databaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "20");
    return url.toString();
  } catch {
    return raw;
  }
}

// P2024: pool timeout · P1001: can't reach server · P1017: server closed the connection
const RETRYABLE = new Set(["P2024", "P1001", "P1017"]);
const MAX_RETRIES = 2;

const isRetryable = (e: unknown) =>
  (e instanceof Prisma.PrismaClientKnownRequestError && RETRYABLE.has(e.code)) ||
  (e instanceof Prisma.PrismaClientInitializationError && RETRYABLE.has(e.errorCode ?? ""));

function createClient() {
  return new PrismaClient({ log: ["error"], datasourceUrl: databaseUrl() }).$extends({
    name: "retry-lost-connections",
    query: {
      async $allOperations({ args, query }) {
        for (let attempt = 0; ; attempt++) {
          try {
            return await query(args);
          } catch (e) {
            if (attempt >= MAX_RETRIES || !isRetryable(e)) throw e;
            await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
          }
        }
      },
    },
  });
}

type Client = ReturnType<typeof createClient>;

// Reuse one client across hot reloads in development.
const globalForPrisma = globalThis as unknown as { prisma?: Client };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
