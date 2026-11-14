/**
 * Descriptive wellness insights.
 * Everything here summarises what the user recorded. It never claims causation
 * and never produces a diagnosis.
 */
import type { Mood, TriggerCategory } from "@prisma/client";

export type InsightInput = {
  moods: { mood: Mood; intensity: number; recordedAt: Date }[];
  episodes: { startedAt: Date; endedAt: Date | null; intensity: number; triggers: { category: TriggerCategory }[] }[];
  sleep: { date: Date; hours: number; quality: number }[];
  energy: { date: Date; energy: number }[];
};

export type Observation =
  | { key: "topTrigger"; trigger: TriggerCategory; count: number; total: number }
  | { key: "lowSleepMigraine"; lowSleepShare: number; overallLowSleepShare: number }
  | { key: "steadyMood"; mood: Mood; count: number };

const day = (d: Date) => d.toISOString().slice(0, 10);
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const round1 = (n: number | null) => (n === null ? null : Math.round(n * 10) / 10);

export function computeInsights({ moods, episodes, sleep, energy }: InsightInput, days: number, now = new Date()) {
  // Mood
  const moodCounts: Partial<Record<Mood, number>> = {};
  for (const m of moods) moodCounts[m.mood] = (moodCounts[m.mood] ?? 0) + 1;

  // Daily timeline (oldest → newest)
  const sleepByDay = new Map(sleep.map((s) => [day(s.date), s]));
  const energyByDay = new Map(energy.map((e) => [day(e.date), e]));
  const migraineByDay = new Map<string, number>();
  for (const e of episodes) migraineByDay.set(day(e.startedAt), (migraineByDay.get(day(e.startedAt)) ?? 0) + 1);
  const moodByDay = new Map<string, number[]>();
  for (const m of moods) {
    const k = day(m.recordedAt);
    moodByDay.set(k, [...(moodByDay.get(k) ?? []), m.intensity]);
  }

  const daily = Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - (days - 1 - i));
    const k = day(d);
    return {
      date: k,
      sleepHours: sleepByDay.get(k)?.hours ?? null,
      sleepQuality: sleepByDay.get(k)?.quality ?? null,
      energy: energyByDay.get(k)?.energy ?? null,
      migraines: migraineByDay.get(k) ?? 0,
      moodIntensity: round1(avg(moodByDay.get(k) ?? [])),
      checkIns: moodByDay.get(k)?.length ?? 0,
    };
  });

  // Migraine
  const durations = episodes
    .filter((e) => e.endedAt)
    .map((e) => (e.endedAt!.getTime() - e.startedAt.getTime()) / 3_600_000);
  const triggerCounts: Partial<Record<TriggerCategory, number>> = {};
  for (const e of episodes) for (const t of e.triggers) triggerCounts[t.category] = (triggerCounts[t.category] ?? 0) + 1;
  const byMonth = new Map<string, number>();
  for (const e of episodes) {
    const k = e.startedAt.toISOString().slice(0, 7);
    byMonth.set(k, (byMonth.get(k) ?? 0) + 1);
  }

  // Descriptive observations — only when there is enough data to be meaningful.
  const observations: Observation[] = [];
  const triggers = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]) as [TriggerCategory, number][];
  if (episodes.length >= 3 && triggers[0] && triggers[0][1] >= 2) {
    observations.push({ key: "topTrigger", trigger: triggers[0][0], count: triggers[0][1], total: episodes.length });
  }

  if (episodes.length >= 3 && sleep.length >= 7) {
    const lowSleep = (k: string) => {
      const prev = new Date(`${k}T00:00:00Z`);
      prev.setUTCDate(prev.getUTCDate() - 1);
      const s = sleepByDay.get(k) ?? sleepByDay.get(day(prev));
      return s ? s.hours < 6 : null;
    };
    const migraineDays = [...migraineByDay.keys()].map(lowSleep).filter((v): v is boolean => v !== null);
    const overall = sleep.filter((s) => s.hours < 6).length / sleep.length;
    if (migraineDays.length >= 3) {
      const share = migraineDays.filter(Boolean).length / migraineDays.length;
      if (share - overall >= 0.2) {
        observations.push({
          key: "lowSleepMigraine",
          lowSleepShare: Math.round(share * 100),
          overallLowSleepShare: Math.round(overall * 100),
        });
      }
    }
  }

  const topMood = (Object.entries(moodCounts) as [Mood, number][]).sort((a, b) => b[1] - a[1])[0];
  if (topMood && moods.length >= 5) observations.push({ key: "steadyMood", mood: topMood[0], count: topMood[1] });

  return {
    days,
    mood: { total: moods.length, counts: moodCounts },
    migraine: {
      count: episodes.length,
      avgDurationHours: round1(avg(durations)),
      avgIntensity: round1(avg(episodes.map((e) => e.intensity))),
      byMonth: [...byMonth.entries()].sort().map(([month, count]) => ({ month, count })),
      triggers: triggers.map(([category, count]) => ({ category, count })),
    },
    sleep: {
      entries: sleep.length,
      avgHours: round1(avg(sleep.map((s) => s.hours))),
      avgQuality: round1(avg(sleep.map((s) => s.quality))),
    },
    energy: { entries: energy.length, avg: round1(avg(energy.map((e) => e.energy))) },
    daily,
    observations,
  };
}

export type Insights = ReturnType<typeof computeInsights>;

export async function loadInsights(userId: string, days: number) {
  const { prisma } = await import("@/lib/database/prisma");
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  const [moods, episodes, sleep, energy] = await Promise.all([
    prisma.moodEntry.findMany({ where: { userId, recordedAt: { gte: since } }, select: { mood: true, intensity: true, recordedAt: true } }),
    prisma.migraineEpisode.findMany({
      where: { userId, startedAt: { gte: since } },
      select: { startedAt: true, endedAt: true, intensity: true, triggers: { select: { category: true } } },
    }),
    prisma.sleepEntry.findMany({ where: { userId, date: { gte: since } }, select: { date: true, hours: true, quality: true } }),
    prisma.energyEntry.findMany({ where: { userId, date: { gte: since } }, select: { date: true, energy: true } }),
  ]);
  return computeInsights({ moods, episodes, sleep, energy }, days);
}
