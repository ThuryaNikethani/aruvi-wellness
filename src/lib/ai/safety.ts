/**
 * First-pass crisis detection.
 *
 * This is a deliberately broad, high-recall keyword screen in English, Sinhala
 * and Tamil (plus common romanised Sinhala). It never blocks a conversation:
 * a match shows human-support information in the UI and adds a safety
 * instruction for the model. The model is also told to recognise risk on its
 * own, so languages without patterns here are still covered.
 */
const PATTERNS: RegExp[] = [
  // English
  /\b(kill|hurt|harm|cut)\s+(myself|me)\b/i,
  /\bsuicid(e|al)\b/i,
  /\b(end|take)\s+(my|my own)\s+life\b/i,
  /\bwant\s+to\s+die\b/i,
  /\b(don'?t|do not)\s+want\s+to\s+(live|be alive|wake up)\b/i,
  /\bbetter\s+off\s+(dead|without me)\b/i,
  /\bno\s+reason\s+to\s+live\b/i,
  /\boverdose\b/i,
  /\bself[-\s]?harm\b/i,
  // Sinhala
  /සියදිවි/,
  /මැරෙන්න\s*(ඕන|ඕනෑ|හිතෙනවා)/,
  /ජීවත්\s*වෙන්න\s*(ඕන\s*නෑ|අවශ්‍ය\s*නැ)/,
  /මට\s*මාව\s*(මරාගන්න|තුවාල)/,
  // Romanised Sinhala (Singlish)
  /\b(marenna|maranna)\s*(ona|one|hithenawa)\b/i,
  /\bjeewath\s*wenna\s*(ona\s*na|epa)\b/i,
  /\bsiyadivi\b/i,
  // Tamil
  /தற்கொலை/,
  /சாக\s*(வேண்டும்|விரும்புகிறேன்|போகிறேன்)/,
  /வாழ\s*விருப்பம்\s*இல்லை/,
  /என்னை\s*(நானே\s*)?(காயப்படுத்த|கொல்ல)/,
];

export function detectCrisis(text: string) {
  return PATTERNS.some((p) => p.test(text));
}
