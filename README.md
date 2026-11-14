# ARUVI

**A gentler place for difficult days.**

ARUVI is a free, private, multilingual wellness web app for people living with migraine, depression, anxiety and stress. It is a supportive companion — **not** a replacement for professional medical or psychological care.

## What's built

| Area | Status |
|---|---|
| Brand, design tokens, light/dark themes, text size | ✅ |
| Homepage, mood check-in, Calm Space breathing | ✅ (works without an account) |
| Languages: English, Sinhala, Tamil (full) + 44 more (English fallback, RTL) | ✅ |
| Auth.js: email + password (Argon2id), optional Google, email verification | ✅ |
| PostgreSQL schema (Prisma) for all 13 entities | ✅ |
| Mood & journal, migraine diary, sleep & energy | ✅ |
| Doctor report (print / save as PDF, all scripts) | ✅ |
| Wellness insights with charts (descriptive only) | ✅ |
| AI companion (Claude) with crisis screen and safety prompt | ✅ |
| Settings: preferences, data export, permanent account deletion | ✅ |
| Mobile app (Flutter, Android + iOS) sharing the same API | ✅ see [mobile/README.md](mobile/README.md) |
| Nature sounds, PWA offline, voice notes | ⏳ next |

## Getting started

Requires Node.js 20+ and a PostgreSQL database.

```bash
npm install
cp .env.example .env.local     # then fill in DATABASE_URL, AUTH_SECRET, ANTHROPIC_API_KEY
npm run db:push                # create the tables
npm run dev                    # http://localhost:3000
```

Other scripts: `npm run build`, `npm test` (Vitest), `npm run typecheck`, `npm run db:migrate`, `npm run db:studio`.

**No PostgreSQL locally?** A free hosted database from [Neon](https://neon.tech) or [Supabase](https://supabase.com) works — paste its connection string into `DATABASE_URL`.

## API

All endpoints are JSON, require a signed-in user, and are scoped to that user. The website uses the Auth.js session cookie; the mobile app sends `Authorization: Bearer <token>`. Cookie-based mutations must come from the same origin (CSRF protection). Everything is rate-limited.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create account (`name?`, `email`, `password`, `locale`, `acceptTerms`, `acceptHealthData`) |
| GET | `/api/auth/verify` | Email verification link target |
| GET, POST | `/api/mood` | List (`?days=&limit=`) / add mood check-in |
| DELETE | `/api/mood/:id` | Delete a check-in |
| GET, POST | `/api/journal` | List / create journal entry |
| GET, PATCH, DELETE | `/api/journal/:id` | Read / edit / delete entry |
| GET, POST | `/api/migraine` | List / record episode (symptoms, triggers included) |
| GET, DELETE | `/api/migraine/:id` | Read / delete episode |
| GET, POST | `/api/sleep` | List / upsert one sleep record per day |
| GET, POST | `/api/energy` | List / upsert one energy record per day |
| POST | `/api/calm` | Log a Calm Space session |
| GET | `/api/insights?days=` | Descriptive summary + observations |
| GET, PATCH | `/api/preferences` | Read / update preferences |
| POST | `/api/ai/chat` | Companion message → streamed plain-text reply |
| GET, DELETE | `/api/ai/conversations` | List / delete all stored conversations |
| GET, DELETE | `/api/ai/conversations/:id` | Read / delete one conversation |
| POST | `/api/mobile/auth/register` | Mobile sign-up (same body as web register) |
| POST | `/api/mobile/auth/login` | Mobile sign-in → `{ token, user }` (30-day bearer token) |
| GET | `/api/mobile/me` | Signed-in user and preferences |
| GET | `/api/account/export` | Download all personal data (JSON) |
| DELETE | `/api/account` | Permanently delete account (`{"confirm":"DELETE"}`) |

## AI companion

- Model: `claude-opus-5-5` via the official `@anthropic-ai/sdk`, streamed. The server-side refusal fallback is on (`fallbacks: "default"`).
- Safety: a system prompt with firm limits (no diagnosis, no medication advice, not a therapist), plus a multilingual crisis screen in [`src/lib/ai/safety.ts`](src/lib/ai/safety.ts). When the screen matches, the UI shows helplines straight away and the model gets an extra safety instruction.
- Privacy: conversations are **not stored** unless the user turns on "Keep companion conversation history" in Settings. Message content is never logged.
- Cost control: 40 messages per user per hour, plus a per-IP rate limit.

## Languages

All languages live in [`src/i18n/locales.ts`](src/i18n/locales.ts). `en`, `si` and `ta` have complete human translations in `messages/`. हिन्दी, العربية, 中文 and Español are translated too. Every other listed language works and falls back to English until `messages/<code>.json` is added. RTL languages get `dir="rtl"` automatically.

**Translate all other languages:** `npm run translate` translates `messages/en.json` into every language in the registry with Claude (needs `ANTHROPIC_API_KEY` in `.env.local`). Only missing or changed strings are sent, so re-running after editing English is cheap. Use `npm run translate -- ja fr` for specific languages, then `npm run mobile:i18n` to update the mobile app. Machine-translated languages show a small notice until they are reviewed.

> Translations of mental-health content should be reviewed by fluent speakers before launch.

## Security & privacy notes

- Passwords: Argon2id. Sessions: signed JWT cookies (14 days).
- Every query is filtered by the signed-in user's id; deleting an account cascades to all data.
- Same-origin check on all mutations; Zod validation on every input; React escapes all output.
- Security headers set in `next.config.ts`. No request bodies in logs.
- The rate limiter is in-memory. Use Upstash Redis when deploying to several instances.

See [docs/safety.md](docs/safety.md) for crisis numbers and content rules.
