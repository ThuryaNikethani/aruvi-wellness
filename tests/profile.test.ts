import { describe, expect, it } from "vitest";
import { completeProfileSchema, latestBirthYear, registerSchema } from "@/lib/validation/schemas";

const base = {
  email: "a@example.com",
  password: "a long enough passphrase",
  acceptTerms: true,
  acceptHealthData: true,
};

describe("profile at sign-up", () => {
  it("accepts a 16-year-old and normalises concerns", () => {
    const r = registerSchema.parse({ ...base, birthYear: latestBirthYear(), concerns: ["migraine", "anxiety"] });
    expect(r.concerns).toEqual(["MIGRAINE", "ANXIETY"]);
  });

  it("rejects anyone younger than 16", () => {
    expect(registerSchema.safeParse({ ...base, birthYear: latestBirthYear() + 1 }).success).toBe(false);
  });

  it("rejects unknown concerns", () => {
    expect(registerSchema.safeParse({ ...base, birthYear: 1990, concerns: ["cancer"] }).success).toBe(false);
  });

  it("still accepts older mobile builds that send no profile", () => {
    expect(registerSchema.parse(base).concerns).toEqual([]);
  });

  it("requires a birth year to complete the profile", () => {
    expect(completeProfileSchema.safeParse({ concerns: [] }).success).toBe(false);
    expect(completeProfileSchema.safeParse({ birthYear: "1995" }).success).toBe(true);
  });
});
