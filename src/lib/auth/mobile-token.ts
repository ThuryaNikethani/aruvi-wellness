import { SignJWT, jwtVerify } from "jose";

/**
 * Bearer tokens for the ARUVI mobile app.
 * Browsers use the Auth.js session cookie; native apps send
 * `Authorization: Bearer <token>` instead.
 */
const AUDIENCE = "aruvi-mobile";
const ISSUER = "aruvi";
const TTL = "30d";

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  // Separate key from Auth.js cookies, derived from the same secret.
  return new TextEncoder().encode(`${secret}:mobile-token`);
}

export async function issueMobileToken(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setAudience(AUDIENCE)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(TTL)
    .sign(key());
}

export async function verifyMobileToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key(), { audience: AUDIENCE, issuer: ISSUER, algorithms: ["HS256"] });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export function bearerToken(req: Request) {
  const header = req.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  return header.slice(7).trim() || null;
}
