# ARUVI

**A gentler place for difficult days.**

ARUVI is a free, private, multilingual wellness web app for people living with migraine, depression, anxiety and stress. It is a supportive companion — **not** a replacement for professional medical or psychological care.

## Status — Milestone 1 (UI foundation)

- [x] Brand identity: logo mark (water drop + stream), colour tokens, typography
- [x] Light / dark themes and user-controlled text size (saved per device)
- [x] Homepage: hero, mood check-in, Calm Space preview, features, promise, help
- [x] Responsive navigation with accessible mobile menu
- [x] Mood check-in (9 moods, intensity, gentle responses, stored on device only)
- [x] Calm Space breathing preview (pause / resume / stop, reduced-motion aware)
- [x] Multilingual: English, Sinhala and Tamil fully translated; 40+ more languages routable, with RTL support

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck
```

Requires Node.js 20+.

## Languages

All languages live in [`src/i18n/locales.ts`](src/i18n/locales.ts).

- **Curated** (`en`, `si`, `ta`) have complete, human-written translations in `messages/`.
- **Every other language** is fully routable (e.g. `/hi`, `/ar`, `/ja`). Missing strings fall back to English, and a small notice tells the reader the translation is in progress.
- Right-to-left scripts (Arabic, Persian, Hebrew, Urdu, Dhivehi…) automatically get `dir="rtl"`.

**To add a language:** add its BCP 47 code to `allLocales`, then optionally create `messages/<code>.json` with any subset of the keys in `messages/en.json`. Native language names are generated with `Intl.DisplayNames`.

> Translations for mental-health content should be reviewed by fluent speakers, ideally with clinical input, before launch.

## Design tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#f6f4ee` | `#111916` | Page background (morning mist) |
| `--ink` | `#22312c` | `#e4ebe7` | Body text (deep forest) |
| `--leaf` | `#2f6f5b` | `#82c4ab` | Primary actions |
| `--stream` | `#3b7a8f` | `#8bc0d1` | Secondary / focus ring |
| `--clay` | `#a8634a` | `#e0a58b` | Warm accent, help section |

Fonts: Fraunces (headings), Nunito (body), Noto Sans Sinhala, Noto Sans Tamil.

## Accessibility & migraine-friendly rules

- No autoplay audio, no flashing, no fast motion; `prefers-reduced-motion` is honoured globally.
- Keyboard navigable with visible focus rings and a skip link.
- Every activity can be paused or stopped at any time.

## Project structure

```
messages/            Translation files (en, si, ta, …)
src/app/[locale]/    Localised routes (layout + homepage)
src/components/      brand/, layout/, home/
src/i18n/            Locale registry, routing, request config
docs/                Safety notes
```

## Roadmap

See the phases in the project brief: authentication & database → mood journal & migraine diary → Calm Space sounds → AI companion with safety layer → insights → security/accessibility testing → PWA launch.
