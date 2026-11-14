import { z } from "zod";
import { Concern, Mood, TriggerCategory, ThemePreference, TextSize } from "@prisma/client";

const upper = (v: unknown) => (typeof v === "string" ? v.toUpperCase() : v);
const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const moodValue = z.preprocess(upper, z.nativeEnum(Mood));

// ───── Auth ─────
export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

// ───── Profile (asked at sign-up, or on first Google sign-in) ─────
export const MIN_AGE = 16;
export const latestBirthYear = () => new Date().getUTCFullYear() - MIN_AGE;
export const birthYearValue = z.coerce
  .number()
  .int()
  .min(1900)
  .refine((y) => y <= latestBirthYear(), "too_young");
export const concernsValue = z.array(z.preprocess(upper, z.nativeEnum(Concern))).max(6).default([]);

export const registerSchema = z.object({
  name: optionalText(80),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(10, "password_too_short").max(200),
  locale: z.string().min(2).max(10).default("en"),
  acceptTerms: z.literal(true),
  acceptHealthData: z.literal(true),
  // Optional here so older mobile builds keep working; the web form always sends them.
  birthYear: birthYearValue.optional(),
  concerns: concernsValue,
  trackMenstrual: z.boolean().optional(),
});

export const completeProfileSchema = z.object({
  birthYear: birthYearValue,
  concerns: concernsValue,
  trackMenstrual: z.boolean().optional(),
  locale: z.string().min(2).max(10).optional(),
  // Required only when the account has no consent on record yet (e.g. created with Google).
  acceptTerms: z.boolean().optional(),
  acceptHealthData: z.boolean().optional(),
});

// ───── Mood & journal ─────
export const moodEntrySchema = z.object({
  mood: moodValue,
  intensity: z.number().int().min(1).max(5),
  note: optionalText(1000),
});

export const journalEntrySchema = z.object({
  title: optionalText(120),
  content: z.string().trim().min(1).max(20000),
  prompt: optionalText(300),
  mood: moodValue.optional(),
});
export const journalUpdateSchema = journalEntrySchema.partial();

// ───── Migraine ─────
const tag = z.string().trim().min(1).max(40).regex(/^[a-z0-9_]+$/);

export const migraineEpisodeSchema = z
  .object({
    startedAt: z.coerce.date(),
    endedAt: z.coerce.date().optional(),
    intensity: z.number().int().min(0).max(10),
    locations: z.array(tag).max(10).default([]),
    characteristics: z.array(tag).max(10).default([]),
    symptoms: z.array(tag).max(20).default([]),
    triggers: z
      .array(z.object({ category: z.preprocess(upper, z.nativeEnum(TriggerCategory)), note: optionalText(200) }))
      .max(10)
      .default([]),
    medicationNote: optionalText(1000),
    recoveryNote: optionalText(2000),
  })
  .refine((d) => !d.endedAt || d.endedAt >= d.startedAt, { message: "end_before_start", path: ["endedAt"] });

// ───── Sleep & energy ─────
export const sleepEntrySchema = z.object({
  date: isoDate,
  hours: z.number().min(0).max(24),
  quality: z.number().int().min(1).max(5),
  note: optionalText(500),
});

export const energyEntrySchema = z.object({
  date: isoDate,
  energy: z.number().int().min(1).max(5),
  fatigue: z.number().int().min(1).max(5).optional(),
  restMinutes: z.number().int().min(0).max(1440).optional(),
  note: optionalText(500),
});

// ───── Preferences & account ─────
export const preferencesSchema = z
  .object({
    locale: z.string().min(2).max(10),
    theme: z.preprocess(upper, z.nativeEnum(ThemePreference)),
    textSize: z.preprocess(upper, z.nativeEnum(TextSize)),
    reducedMotion: z.boolean(),
    ambientAudio: z.boolean(),
    trackMigraine: z.boolean(),
    trackMenstrual: z.boolean(),
    keepAiHistory: z.boolean(),
    displayName: optionalText(80),
  })
  .partial();

export const deleteAccountSchema = z.object({ confirm: z.literal("DELETE") });

export const rangeQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(366).default(30),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export function dateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}
