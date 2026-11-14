import { SiteHeader } from "@/components/layout/site-header";

export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="scene-forest flex min-h-[calc(100vh-4rem)] items-center px-4 py-12">
        {children}
      </main>
    </>
  );
}
