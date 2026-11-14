import { SiteHeader } from "@/components/layout/site-header";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { requirePageUser } from "@/lib/auth/session";

// Personal data: always render per request, never cache or prerender.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requirePageUser(locale);

  return (
    <>
      <SiteHeader signedIn />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[13rem_1fr] lg:gap-10">
        <DashboardNav />
        <main id="main" className="min-w-0 space-y-6">
          {children}
        </main>
      </div>
    </>
  );
}
