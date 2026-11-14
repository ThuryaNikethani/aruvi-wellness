// Copies shared data into the Flutter app's assets:
//   messages/*.json      → mobile/assets/i18n/   (translations)
//   data/helplines.json  → mobile/assets/data/   (crisis lines by country)
// Run after editing either:  npm run mobile:i18n
import { copyFileSync, mkdirSync, readdirSync } from "node:fs";

mkdirSync("mobile/assets/i18n", { recursive: true });
mkdirSync("mobile/assets/data", { recursive: true });
for (const file of readdirSync("messages").filter((f) => f.endsWith(".json"))) {
  copyFileSync(`messages/${file}`, `mobile/assets/i18n/${file}`);
  console.log(`copied messages/${file}`);
}
copyFileSync("data/helplines.json", "mobile/assets/data/helplines.json");
console.log("copied data/helplines.json");
