import { defineRouting } from "next-intl/routing";
import { allLocales } from "./locales";

export const routing = defineRouting({
  locales: allLocales,
  defaultLocale: "en",
});
