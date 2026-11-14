import { NextResponse } from "next/server";
import { ZodError, type ZodTypeAny, type z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/database/prisma";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

export class ApiError extends Error {
  constructor(public status: number, public code: string) {
    super(code);
  }
}

export function json(data: unknown, status = 200, headers?: HeadersInit) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

/** Returns the signed-in user's id, or throws 401. Also rejects tokens for deleted accounts. */
export async function requireUserId() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new ApiError(401, "unauthorized");
  const exists = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new ApiError(401, "unauthorized");
  return id;
}

export async function parseJson<S extends ZodTypeAny>(req: Request, schema: S): Promise<z.infer<S>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "invalid_json");
  }
  return schema.parse(body);
}

export function parseQuery<S extends ZodTypeAny>(req: Request, schema: S): z.infer<S> {
  return schema.parse(Object.fromEntries(new URL(req.url).searchParams));
}

/** CSRF defence for cookie-authenticated mutations: Origin must match this host. */
function assertSameOrigin(req: Request) {
  if (req.method === "GET" || req.method === "HEAD") return;
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) throw new ApiError(403, "forbidden");
  try {
    if (new URL(origin).host !== host) throw new ApiError(403, "forbidden");
  } catch {
    throw new ApiError(403, "forbidden");
  }
}

type Options = { limit?: number; windowMs?: number };

/** Wraps a route handler with origin checks, rate limiting and safe error responses. */
export function handle<C>(fn: (req: Request, ctx: C) => Promise<Response>, opts: Options = {}) {
  const { limit = 60, windowMs = 60_000 } = opts;
  return async (req: Request, ctx: C) => {
    try {
      assertSameOrigin(req);
      const rl = rateLimit(`${new URL(req.url).pathname}:${req.method}:${clientIp(req)}`, limit, windowMs);
      if (!rl.ok) return json({ error: "rate_limited" }, 429, { "Retry-After": String(rl.retryAfter) });
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) return json({ error: err.code }, err.status);
      if (err instanceof ZodError) return json({ error: "invalid_input", fields: err.flatten().fieldErrors }, 400);
      // Never log request bodies: they may contain health information.
      console.error("api_error", err instanceof Error ? err.name : "unknown");
      return json({ error: "server_error" }, 500);
    }
  };
}

export type IdParams = { params: Promise<{ id: string }> };
