/**
 * ARUVI language registry.
 *
 * - `curated` languages have complete, human-written translations in /messages.
 * - Every other language is fully routable today: missing strings fall back to
 *   English until a translation file (messages/<code>.json) is added.
 * - To add any language in the world: append its BCP 47 code here and
 *   (optionally) drop a messages/<code>.json file, and add its name to NATIVE_NAMES below.
 */
export const curatedLocales = ["en", "si", "ta"] as const;

export const allLocales = [
  ...curatedLocales,
  // South Asia
  "hi", "bn", "ur", "ml", "te", "kn", "mr", "gu", "pa", "ne", "dv",
  // East & South-East Asia
  "zh", "ja", "ko", "th", "vi", "id", "ms", "fil", "my", "km",
  // Middle East & Africa
  "ar", "fa", "he", "tr", "sw", "am", "yo", "ha", "zu",
  // Europe & Americas
  "es", "fr", "de", "pt", "it", "ru", "uk", "pl", "nl", "sv", "ro", "el", "cs", "hu",
] as const;

export type Locale = (typeof allLocales)[number];

const RTL = new Set(["ar", "fa", "he", "ur", "dv", "ps", "sd", "yi"]);

export function isRtl(locale: string) {
  return RTL.has(locale.split("-")[0]);
}

export function isCurated(locale: string) {
  return (curatedLocales as readonly string[]).includes(locale);
}

/**
 * Language names in their own script. A fixed table (not Intl.DisplayNames) so the
 * server and every browser render exactly the same text — no hydration mismatches.
 * Keep in sync with mobile/lib/core/i18n.dart.
 */
const NATIVE_NAMES: Record<string, string> = {
  en: "English", si: "සිංහල", ta: "தமிழ்",
  hi: "हिन्दी", bn: "বাংলা", ur: "اردو", ml: "മലയാളം", te: "తెలుగు", kn: "ಕನ್ನಡ",
  mr: "मराठी", gu: "ગુજરાતી", pa: "ਪੰਜਾਬੀ", ne: "नेपाली", dv: "ދިވެހި",
  zh: "中文", ja: "日本語", ko: "한국어", th: "ไทย", vi: "Tiếng Việt", id: "Bahasa Indonesia",
  ms: "Bahasa Melayu", fil: "Filipino", my: "မြန်မာ", km: "ខ្មែរ",
  ar: "العربية", fa: "فارسی", he: "עברית", tr: "Türkçe", sw: "Kiswahili", am: "አማርኛ",
  yo: "Yorùbá", ha: "Hausa", zu: "isiZulu",
  es: "Español", fr: "Français", de: "Deutsch", pt: "Português", it: "Italiano", ru: "Русский",
  uk: "Українська", pl: "Polski", nl: "Nederlands", sv: "Svenska", ro: "Română", el: "Ελληνικά",
  cs: "Čeština", hu: "Magyar",
};

/** Language name written in its own script, e.g. "සිංහල", "தமிழ்", "日本語". */
export function nativeName(locale: string) {
  return NATIVE_NAMES[locale] ?? locale.toUpperCase();
}
