/**
 * ARUVI language registry.
 *
 * - `curated` languages have complete, human-written translations in /messages.
 * - Every other language is fully routable today: missing strings fall back to
 *   English until a translation file (messages/<code>.json) is added.
 * - To add any language in the world: append its BCP 47 code here and
 *   (optionally) drop a messages/<code>.json file. Native names come from Intl.
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

/** Language name written in its own script, e.g. "සිංහල", "தமிழ்", "日本語". */
export function nativeName(locale: string) {
  try {
    const name = new Intl.DisplayNames([locale], { type: "language" }).of(locale);
    if (name && name !== locale) return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
  } catch {
    /* unsupported by this runtime */
  }
  return locale.toUpperCase();
}
