import { useTranslations } from "next-intl";
import { Wind, HeartHandshake } from "lucide-react";

/** Static landscape – no animation, low contrast, migraine-friendly. */
function Landscape() {
  return (
    <svg viewBox="0 0 480 360" className="h-full w-full" aria-hidden="true" focusable="false">
      <rect width="480" height="360" rx="32" fill="var(--stream-soft)" />
      <circle cx="356" cy="92" r="38" fill="var(--clay-soft)" />
      <path d="M0 210c70-50 140-70 220-40s160 20 260-30v220H0Z" fill="var(--leaf-soft)" />
      <path d="M0 250c90-40 170-30 250 0s150 20 230-10v120H0Z" fill="var(--sand)" opacity="0.8" />
      <path
        d="M40 300c50-18 100-18 150 0s100 18 150 0 70-10 100-4M80 326c40-12 80-12 120 0s80 12 120 0"
        fill="none"
        stroke="var(--stream)"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <g fill="var(--leaf)" opacity="0.85">
        <path d="M96 214c-14-24-6-48 10-62 8 22 6 44-10 62Z" />
        <path d="M120 222c-6-20 2-38 16-46 2 18-2 34-16 46Z" />
        <path d="M392 196c-12-20-6-40 8-52 8 18 6 36-8 52Z" />
      </g>
    </svg>
  );
}

export function Hero() {
  const t = useTranslations("hero");
  return (
    <section aria-labelledby="hero-title" className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.1fr_1fr] md:py-20">
      <div className="space-y-6">
        <p className="inline-flex rounded-full bg-leaf-soft px-3 py-1 text-sm font-semibold text-leaf">{t("eyebrow")}</p>
        <h1 id="hero-title" className="font-display text-4xl font-medium leading-tight text-ink sm:text-5xl">
          {t("title")}
        </h1>
        <p className="max-w-xl text-lg text-ink-soft">{t("body")}</p>
        <div className="flex flex-wrap gap-3">
          <a href="#calm" className="inline-flex items-center gap-2 rounded-full bg-leaf px-5 py-3 font-semibold text-on-leaf hover:opacity-90">
            <Wind className="h-5 w-5" aria-hidden />
            {t("ctaBreathe")}
          </a>
          <a href="#checkin" className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-3 font-semibold text-ink hover:bg-surface-2">
            <HeartHandshake className="h-5 w-5" aria-hidden />
            {t("ctaCheckin")}
          </a>
        </div>
        <p className="text-sm text-ink-soft">{t("note")}</p>
      </div>
      <div className="mx-auto w-full max-w-md md:max-w-none">
        <Landscape />
      </div>
    </section>
  );
}
