import { describe, expect, it } from "vitest";
import { OTHER_COUNTRY, guessCountry, helplinesFor, lineName, supportNote } from "../src/lib/helplines";

describe("helplines", () => {
  it("guesses Sri Lanka for Sinhala and Tamil, India for Hindi", () => {
    expect(guessCountry("si")).toBe("LK");
    expect(guessCountry("ta")).toBe("LK");
    expect(guessCountry("hi")).toBe("IN");
  });

  it("prefers the detected country over the language", () => {
    expect(guessCountry("en", "gb")).toBe("GB");
    expect(guessCountry("ta", "IN")).toBe("IN");
  });

  it("marks detected countries without a verified list as OTHER", () => {
    expect(guessCountry("en", "BR")).toBe(OTHER_COUNTRY);
    expect(helplinesFor(OTHER_COUNTRY)).toEqual([]);
  });

  it("returns localised line names with English fallback", () => {
    const [nimh] = helplinesFor("LK");
    expect(nimh.number).toBe("1926");
    expect(lineName(nimh, "si")).toContain("ජාතික");
    expect(lineName(helplinesFor("US")[0], "si")).toContain("988");
  });

  it("builds a support note for the AI that never invents numbers", () => {
    expect(supportNote("LK", "en")).toContain("1926");
    const other = supportNote(OTHER_COUNTRY, "en");
    expect(other).toContain("findahelpline.com");
    expect(other).not.toMatch(/\d{3}/);
  });

  it("every listed number has a dialable tel value", () => {
    for (const c of ["LK", "IN", "US", "CA", "GB", "IE", "AU", "NZ", "SG"]) {
      for (const l of helplinesFor(c)) expect(l.tel).toMatch(/^\+?\d{3,15}$/);
    }
  });
});
