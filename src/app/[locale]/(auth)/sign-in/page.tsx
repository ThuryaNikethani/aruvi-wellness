import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth, googleEnabled } from "@/auth";
import { AuthForm } from "@/components/auth/auth-form";

export default async function SignInPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  if (session?.user) redirect({ href: "/dashboard", locale });
  return <AuthForm mode="sign-in" googleEnabled={googleEnabled} />;
}
