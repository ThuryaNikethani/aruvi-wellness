import data from "../../data/helplines.json";

export type Helpline = { number: string; tel: string; name: Record<string, string> };

const countries = data.countries as Record<string, { lines: Helpline[] }>;
const localeCountry = data.localeCountry as Record<string, string>;

export const HELPLINE_DIRECTORY = data.directory;
export const HELPLINE_COUNTRIES = Object.keys(countries);
export const OTHER_COUNTRY = "OTHER";

/** Lines for a country, or [] when we don't list one (show the directory instead). */
export function helplinesFor(country: string | null | undefined): Helpline[] {
  return (country && countries[country.toUpperCase()]?.lines) || [];
}

export function lineName(line: Helpline, locale: string) {
  return line.name[locale] ?? line.name.en;
}

/** Best guess when the user hasn't chosen: detected country → language → default. */
export function guessCountry(locale: string, detected?: string | null) {
  const geo = detected?.toUpperCase();
  if (geo && /^[A-Z]{2}$/.test(geo)) return countries[geo] ? geo : OTHER_COUNTRY;
  return localeCountry[locale] ?? data.defaultCountry;
}

/** Plain-text list for the AI companion's per-request instructions. */
export function supportNote(country: string, locale: string) {
  const lines = helplinesFor(country);
  if (!lines.length) {
    return `Support lines: ARUVI has no verified helpline list for the person's country. Suggest their local emergency number, the nearest hospital, and ${HELPLINE_DIRECTORY} to find a crisis line.`;
  }
  const list = lines.map((l) => `${lineName(l, locale)}: ${l.number}`).join("; ");
  return `Support lines for the person's country (${country}): ${list}. If they are elsewhere, suggest their local emergency number or ${HELPLINE_DIRECTORY}.`;
}
