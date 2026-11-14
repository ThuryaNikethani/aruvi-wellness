import { describe, expect, it } from "vitest";
import { OTHER_COUNTRY, guessCountry, helplinesFor, lineName, supportNote } from "../src/lib/helplines";

describe("helplines", () => {
  it("guesses Sri Lanka for Sinhala and Tamil, India for Hindi", () => {
    expect(guessCountry("si")).toBe("LK");
    expect(guessCountry("ta")).toBe("LK");
    expect(guessCountry("hi")).toBe("IN");
  });

  it("switches country with the language", () => {
    expect(guessCountry("ja")).toBe("JP");
    expect(guessCountry("de")).toBe("DE");
    expect(guessCountry("es")).toBe("ES");
    expect(guessCountry("pt")).toBe("BR");
    // The language decides even when the visitor is elsewhere; they can still pick another country.
    expect(guessCountry("ta", "IN")).toBe("LK");
  });

  it("uses the detected country for languages spoken in many countries", () => {
    expect(guessCountry("en", "gb")).toBe("GB");
    expect(guessCountry("en")).toBe("LK");
    expect(guessCountry("ar", "EG")).toBe(OTHER_COUNTRY);
    expect(guessCountry("ar")).toBe(OTHER_COUNTRY);
    expect(guessCountry("ar", "GB")).toBe("GB");
    expect(helplinesFor(OTHER_COUNTRY)).toEqual([]);
  });

  it("every language mapped to a country has at least one number", () => {
    for (const l of ["si", "ta", "hi", "bn", "zh", "ja", "ko", "th", "vi", "id", "ms", "fil", "he", "fa", "tr", "sw", "yo", "ha", "zu", "es", "fr", "de", "pt", "it", "ru", "uk", "pl", "nl", "sv", "ro", "el", "cs", "hu"]) {
      expect(helplinesFor(guessCountry(l)).length, l).toBeGreaterThan(0);
    }
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

  it("every listed number has a dialable tel value", async () => {
    for (const c of Object.keys((await import("../data/helplines.json")).default.countries)) {
      for (const l of helplinesFor(c)) expect(l.tel).toMatch(/^\+?\d{3,15}$/);
    }
  });
});
