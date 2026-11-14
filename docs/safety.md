# Safety notes

## Crisis support numbers

All helplines live in one file, [`data/helplines.json`](../data/helplines.json). It is shared by:

- the website's "Get help" section and the companion's crisis card
- the AI companion (it gets the list for the user's country and is told never to guess a number)
- the mobile app (copied in with `npm run mobile:i18n`)

### Which country is shown

1. The country the user picked in "Your country" for the current language (remembered per language)
2. Otherwise the language's own country: choosing a language switches the numbers
   (සිංහල/தமிழ் → Sri Lanka, हिन्दी → India, 日本語 → Japan, Deutsch → Germany, Español → Spain, Português → Brazil, …)
3. For English, Arabic and other languages spoken in many countries: the detected country
   (`x-vercel-ip-country` / `cf-ipcountry` on the website, the phone's region on mobile)
4. Otherwise: Sri Lanka for English; for other languages, the international directory

A country without a verified list shows "call your local emergency number or go to the nearest hospital" plus a link to [findahelpline.com](https://findahelpline.com), an international directory of free, confidential crisis lines.

### Current list

38 countries, in `data/helplines.json`. Where a crisis line is well established it is listed with the emergency number; otherwise only the emergency number is listed. The language → country map is `localeCountry` in the same file.

**Verify every number before each release.** Only add a country when its numbers come from an official or well-established source. Each line needs `number` (as shown), `tel` (digits to dial) and `name` (at least `en`).

## Content rules

- Never diagnose, and never suggest medication or treatment.
- Insights must be descriptive ("you recorded more episodes on high-stress days"), never causal.
- Mood responses are validating and low-pressure. Avoid streaks and guilt-based nudges.
- Machine-translated text for mental-health content must be reviewed by a fluent speaker before it counts as a curated language.
