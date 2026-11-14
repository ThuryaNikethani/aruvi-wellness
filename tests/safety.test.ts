import { describe, expect, it } from "vitest";
import { detectCrisis } from "../src/lib/ai/safety";

describe("detectCrisis", () => {
  it.each([
    "I want to die",
    "sometimes I think about suicide",
    "I don't want to live anymore",
    "I keep wanting to hurt myself",
    "everyone would be better off without me",
    "මට මැරෙන්න ඕන",
    "සියදිවි නසාගන්න හිතෙනවා",
    "mata marenna hithenawa",
    "தற்கொலை செய்ய நினைக்கிறேன்",
    "எனக்கு வாழ விருப்பம் இல்லை",
  ])("flags %s", (text) => {
    expect(detectCrisis(text)).toBe(true);
  });

  it.each([
    "I had a migraine today and it hurt a lot",
    "I'm dying to see the new movie",
    "මට අද ගොඩක් මහන්සියි",
    "இன்று எனக்கு தலைவலி",
  ])("does not flag %s", (text) => {
    expect(detectCrisis(text)).toBe(false);
  });
});
