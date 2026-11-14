import { NextResponse } from "next/server";
import { consumeVerificationToken } from "@/lib/auth/verification";
import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email")?.toLowerCase() ?? "";
  const token = url.searchParams.get("token") ?? "";
  const requested = url.searchParams.get("locale");
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  let ok = false;
  if (email && /^[a-f0-9]{64}$/.test(token)) {
    try {
      ok = await consumeVerificationToken(email, token);
    } catch {
      ok = false;
    }
  }
  return NextResponse.redirect(new URL(`/${locale}/dashboard?verified=${ok ? "1" : "0"}`, url.origin));
}
