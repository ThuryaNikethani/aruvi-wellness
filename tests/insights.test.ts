import { describe, expect, it } from "vitest";
import { computeInsights } from "../src/lib/insights";

const now = new Date("2026-11-14T12:00:00Z");
const d = (day: string, h = 8) => new Date(`2026-11-${day}T${String(h).padStart(2, "0")}:00:00Z`);

describe("computeInsights", () => {
  it("returns an empty, well-formed summary with no data", () => {
    const r = computeInsights({ moods: [], episodes: [], sleep: [], energy: [] }, 7, now);
    expect(r.daily).toHaveLength(7);
    expect(r.daily.at(-1)?.date).toBe("2026-11-14");
    expect(r.migraine.avgDurationHours).toBeNull();
    expect(r.observations).toEqual([]);
  });

  it("summarises migraine episodes and reports the most noted trigger descriptively", () => {
    const episodes = [
      { startedAt: d("10", 8), endedAt: d("10", 12), intensity: 6, triggers: [{ category: "STRESS" as const }] },
      { startedAt: d("12", 9), endedAt: d("12", 11), intensity: 4, triggers: [{ category: "STRESS" as const }, { category: "SCREEN" as const }] },
      { startedAt: d("13", 9), endedAt: null, intensity: 8, triggers: [] },
    ];
    const r = computeInsights({ moods: [], episodes, sleep: [], energy: [] }, 7, now);
    expect(r.migraine.count).toBe(3);
    expect(r.migraine.avgDurationHours).toBe(3);
    expect(r.migraine.avgIntensity).toBe(6);
    expect(r.observations).toContainEqual({ key: "topTrigger", trigger: "STRESS", count: 2, total: 3 });
  });

  it("only mentions low sleep on migraine days when it clearly stands out", () => {
    const days = ["05", "06", "07", "08", "09", "10", "11", "12", "13", "14"];
    const sleep = days.map((day) => ({ date: d(day, 0), hours: ["10", "12", "13"].includes(day) ? 5 : 8, quality: 3 }));
    const episodes = ["10", "12", "13"].map((day) => ({ startedAt: d(day), endedAt: null, intensity: 5, triggers: [] }));
    const r = computeInsights({ moods: [], episodes, sleep, energy: [] }, 14, now);
    expect(r.observations).toContainEqual({ key: "lowSleepMigraine", lowSleepShare: 100, overallLowSleepShare: 30 });
  });
});
