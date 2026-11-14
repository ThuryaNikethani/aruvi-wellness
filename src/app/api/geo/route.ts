import { NextResponse } from "next/server";

/**
 * The visitor's country as reported by the hosting edge (Vercel or Cloudflare).
 * Used only to pick sensible helpline numbers; nothing is stored.
 */
export function GET(req: Request) {
  const country = req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry");
  return NextResponse.json(
    { country: country && /^[A-Z]{2}$/i.test(country) ? country.toUpperCase() : null },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
