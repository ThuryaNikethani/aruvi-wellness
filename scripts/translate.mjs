// Machine-translates messages/en.json into every language ARUVI offers, using Claude.
//
//   npm run translate            # all languages that are missing text or out of date
//   npm run translate -- hi ja   # only these languages
//
// Needs ANTHROPIC_API_KEY (read from .env.local). Only missing keys, or keys whose
// English text changed since the last run, are sent — so re-running is cheap.
// English, Sinhala and Tamil are human-translated and never touched.
// Mental-health wording should be reviewed by a fluent speaker before launch.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-5-5";
const CURATED = new Set(["en", "si", "ta"]);
const STATE_FILE = "messages/.translation-state.json";
const CHUNK = 80;

// ── Languages: read the registry so this list never drifts ──
const registry = readFileSync("src/i18n/locales.ts", "utf8");
const start = registry.indexOf("allLocales = [");
const block = registry.slice(start, registry.indexOf("] as const", start));
const allLocales = ["en", "si", "ta", ...[...block.matchAll(/"([a-z]{2,3})"/g)].map((m) => m[1])];
const names = Object.fromEntries([...registry.matchAll(/\b([a-z]{2,3}): "([^"]+)"/g)].map((m) => [m[1], m[2]]));
const requested = process.argv.slice(2);
const targets = (requested.length ? requested : allLocales).filter((l) => !CURATED.has(l) && allLocales.includes(l));

// ── Helpers ──
const flatten = (obj, prefix = "") =>
  Object.entries(obj).reduce((acc, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    return typeof v === "object" && v !== null ? { ...acc, ...flatten(v, key) } : { ...acc, [key]: v };
  }, {});

// Rebuild nested JSON in the same key order as English.
const unflattenLike = (flat, template, prefix = "") =>
  Object.fromEntries(
    Object.entries(template).map(([k, v]) => {
      const key = prefix ? `${prefix}.${k}` : k;
      return [k, typeof v === "object" && v !== null ? unflattenLike(flat, v, key) : flat[key] ?? v];
    }),
  );

const hash = (s) => createHash("sha256").update(s).digest("hex").slice(0, 12);
// Top-level ICU argument names, e.g. {name}, {count, plural, ...} → name, count
const argNames = (s) => new Set([...s.matchAll(/\{\s*(\w+)\s*[,}]/g)].map((m) => m[1]));
const sameArgs = (a, b) => {
  const x = argNames(a), y = argNames(b);
  return x.size === y.size && [...x].every((n) => y.has(n));
};

function loadEnv() {
  if (process.env.ANTHROPIC_API_KEY || !existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^ANTHROPIC_API_KEY\s*=\s*"?([^"]*)"?\s*$/);
    if (m && m[1]) process.env.ANTHROPIC_API_KEY = m[1];
  }
}

const SYSTEM = `You translate the interface of ARUVI, a free, gentle wellness app for people living with migraine, depression, anxiety and stress.

Tone: warm, calm, plain and kind — never clinical, never pushy. Use the form of address that feels gentle and respectful in the target language. Keep sentences short.

Rules:
- Translate the meaning naturally; don't translate word for word.
- Keep every placeholder exactly as written, e.g. {name}, {count}, {seconds}.
- ICU plural/select messages like "{count, plural, =0 {...} one {...} other {...}}": keep the structure, the argument name and the "#" sign; translate only the text inside the inner braces. You may use the plural categories that are correct for the target language (zero, one, two, few, many, other); always include "other".
- Never translate: "ARUVI", "DELETE", "AI" when used as a name, email addresses, URLs, phone numbers.
- Safety text (crisis, emergency, "not a doctor") must stay exactly as clear as the English.
- Return every key you were given, translated, and nothing else.`;

async function translateChunk(client, language, entries) {
  const response = await client.beta.messages
    .stream({
      model: MODEL,
      max_tokens: 64000,
      output_config: {
        effort: "medium",
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: { key: { type: "string" }, text: { type: "string" } },
                  required: ["key", "text"],
                  additionalProperties: false,
                },
              },
            },
            required: ["items"],
            additionalProperties: false,
          },
        },
      },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Target language: ${language}\n\nTranslate these interface strings (key → English):\n\n${JSON.stringify(Object.fromEntries(entries), null, 2)}`,
        },
      ],
    })
    .finalMessage();

  if (response.stop_reason === "refusal") throw new Error("model declined this chunk");
  if (response.stop_reason === "max_tokens") throw new Error("output was cut off; lower CHUNK");
  const text = response.content.find((b) => b.type === "text")?.text ?? "";
  return JSON.parse(text).items;
}

// ── Main ──
loadEnv();
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is missing. Add it to .env.local, then run: npm run translate");
  process.exit(1);
}
const client = new Anthropic();
const en = JSON.parse(readFileSync("messages/en.json", "utf8"));
const enFlat = flatten(en);
const state = existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, "utf8")) : {};

let problems = 0;
for (const locale of targets) {
  const file = `messages/${locale}.json`;
  const current = existsSync(file) ? flatten(JSON.parse(readFileSync(file, "utf8"))) : {};
  const seen = (state[locale] ??= {});
  // Hand-made files without state: treat their existing keys as up to date.
  if (!Object.keys(seen).length) for (const k of Object.keys(current)) if (enFlat[k] !== undefined) seen[k] = hash(enFlat[k]);

  const todo = Object.entries(enFlat).filter(([k, v]) => current[k] === undefined || seen[k] !== hash(v));
  if (!todo.length) {
    console.log(`✓ ${locale} up to date`);
    continue;
  }
  const language = `${names[locale] ?? locale} (${locale})`;
  console.log(`→ ${language}: ${todo.length} strings`);

  for (let i = 0; i < todo.length; i += CHUNK) {
    const chunk = todo.slice(i, i + CHUNK);
    let items;
    try {
      items = await translateChunk(client, language, chunk);
    } catch (err) {
      problems++;
      console.error(`  ✗ chunk ${i / CHUNK + 1}: ${err instanceof Error ? err.message : err}`);
      continue;
    }
    const got = new Map(items.map((it) => [it.key, it.text]));
    for (const [key, english] of chunk) {
      const t = got.get(key);
      if (typeof t !== "string" || !t.trim()) {
        problems++;
        console.warn(`  ! missing ${key}`);
      } else if (!sameArgs(english, t)) {
        problems++;
        console.warn(`  ! placeholders changed in ${key}; kept English`);
      } else {
        current[key] = t;
        seen[key] = hash(english);
      }
    }
    // Save after every chunk so an interrupted run can resume.
    writeFileSync(file, JSON.stringify(unflattenLike(current, en), null, 2) + "\n");
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + "\n");
    console.log(`  saved ${Math.min(i + CHUNK, todo.length)}/${todo.length}`);
  }
}

console.log(problems ? `\nDone with ${problems} problem(s) — re-run to retry.` : "\nDone.");
console.log("Next: npm run mobile:i18n  (copies translations into the mobile app)");
