import { NextResponse } from "next/server";
import { ZodError, type ZodTypeAny, type z } from "zod";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { bearerToken, verifyMobileToken } from "@/lib/auth/mobile-token";
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

/**
 * Returns the signed-in user's id, or throws 401. Also rejects tokens for deleted accounts.
 * Mobile app: `Authorization: Bearer <token>`. Web: Auth.js session cookie.
 * A bearer header that fails verification is rejected; it never falls back to cookies.
 */
export async function requireUserId() {
  const authHeader = (await headers()).get("authorization");
  let id: string | null | undefined;
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    id = await verifyMobileToken(authHeader.slice(7).trim());
  } else {
    id = (await auth())?.user?.id;
  }
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

/**
 * CSRF defence for cookie-authenticated mutations: Origin must match this host.
 * Bearer-token requests (mobile app) are exempt: browsers can't attach that header cross-site.
 */
function assertSameOrigin(req: Request) {
  if (req.method === "GET" || req.method === "HEAD") return;
  if (bearerToken(req)) return;
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) throw new ApiError(403, "forbidden");
  try {
    if (new URL(origin).host !== host) throw new ApiError(403, "forbidden");
  } catch {
    throw new ApiError(403, "forbidden");
  }
}

/** `cookieless`: endpoint never reads the session cookie (mobile login/register), so no CSRF risk. */
type Options = { limit?: number; windowMs?: number; cookieless?: boolean };

/** Wraps a route handler with origin checks, rate limiting and safe error responses. */
export function handle<C>(fn: (req: Request, ctx: C) => Promise<Response>, opts: Options = {}) {
  const { limit = 60, windowMs = 60_000, cookieless = false } = opts;
  return async (req: Request, ctx: C) => {
    try {
      if (!cookieless) assertSameOrigin(req);
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
