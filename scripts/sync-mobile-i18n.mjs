// Copies the shared translation files into the Flutter app's assets.
// Run after editing anything in /messages:  npm run mobile:i18n
import { copyFileSync, mkdirSync, readdirSync } from "node:fs";

const out = "mobile/assets/i18n";
mkdirSync(out, { recursive: true });
for (const file of readdirSync("messages").filter((f) => f.endsWith(".json"))) {
  copyFileSync(`messages/${file}`, `${out}/${file}`);
  console.log(`copied ${file}`);
}
