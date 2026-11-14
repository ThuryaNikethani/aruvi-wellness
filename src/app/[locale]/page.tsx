import { setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { TranslationNotice } from "@/components/layout/translation-notice";
import { Hero } from "@/components/home/hero";
import { MoodCheckIn } from "@/components/home/mood-check-in";
import { CalmSpacePreview } from "@/components/home/calm-space-preview";
import { Features } from "@/components/home/features";
import { OurPromise } from "@/components/home/our-promise";
import { HelpSection } from "@/components/home/help-section";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <SiteHeader />
      <TranslationNotice />
      <main id="main">
        <Hero />
        <MoodCheckIn />
        <CalmSpacePreview />
        <Features />
        <OurPromise />
        <HelpSection />
      </main>
      <SiteFooter />
    </>
  );
}
