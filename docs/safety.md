# Safety notes

## Crisis support numbers

All helplines live in one file, [`data/helplines.json`](../data/helplines.json). It is shared by:

- the website's "Get help" section and the companion's crisis card
- the AI companion (it gets the list for the user's country and is told never to guess a number)
- the mobile app (copied in with `npm run mobile:i18n`)

### Which country is shown

1. The country the user picked ("Your country" selector, remembered on the device)
2. Otherwise the detected country (`x-vercel-ip-country` / `cf-ipcountry` header on the website, the phone's region on mobile)
3. Otherwise the language (Sinhala/Tamil → Sri Lanka, Indian languages → India)
4. Otherwise Sri Lanka

A country without a verified list shows "call your local emergency number or go to the nearest hospital" plus a link to [findahelpline.com](https://findahelpline.com), an international directory of free, confidential crisis lines.

### Current list

| Country | Lines |
|---|---|
| Sri Lanka | 1926 National Mental Health Helpline (24 h), 1990 Suwa Seriya, 119 Police |
| India | 14416 Tele-MANAS (24 h), 112 Emergency |
| United States | 988 Suicide & Crisis Lifeline, 911 |
| Canada | 988 Suicide Crisis Helpline, 911 |
| United Kingdom | 116 123 Samaritans, 999 |
| Ireland | 116 123 Samaritans, 112 |
| Australia | 13 11 14 Lifeline, 000 |
| New Zealand | 1737 Need to talk?, 111 |
| Singapore | 1767 Samaritans of Singapore, 995 |

**Verify every number before each release.** Only add a country when its numbers come from an official or well-established source. Each line needs `number` (as shown), `tel` (digits to dial) and `name` (at least `en`).

## Content rules

- Never diagnose, and never suggest medication or treatment.
- Insights must be descriptive ("you recorded more episodes on high-stress days"), never causal.
- Mood responses are validating and low-pressure. Avoid streaks and guilt-based nudges.
- Machine-translated text for mental-health content must be reviewed by a fluent speaker before it counts as a curated language.
