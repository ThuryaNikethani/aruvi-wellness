export const LOCATIONS = ["left", "right", "both_sides", "forehead", "temples", "behind_eyes", "back_of_head", "neck"] as const;
export const CHARACTERISTICS = ["throbbing", "pressing", "stabbing", "dull"] as const;
export const SYMPTOMS = [
  "nausea", "vomiting", "light_sensitivity", "sound_sensitivity", "smell_sensitivity",
  "aura", "dizziness", "fatigue", "blurred_vision",
] as const;
export const TRIGGERS = [
  "sleep", "stress", "weather", "dehydration", "meal_timing", "screen", "environment", "menstrual", "other",
] as const;
