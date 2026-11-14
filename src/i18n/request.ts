import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import en from "../../messages/en.json";

type Messages = { [key: string]: string | Messages };

function deepMerge(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = out[key];
    out[key] =
      typeof value === "object" && typeof current === "object" ? deepMerge(current, value) : value;
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  let localized: Messages = {};
  if (locale !== "en") {
    try {
      localized = (await import(`../../messages/${locale}.json`)).default;
    } catch {
      // No translation file yet — English strings are used as a gentle fallback.
    }
  }

  return { locale, messages: deepMerge(en as Messages, localized) };
});
