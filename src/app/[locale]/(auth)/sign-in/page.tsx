import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth, googleEnabled } from "@/auth";
import { AuthForm } from "@/components/auth/auth-form";

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  setRequestLocale(locale);
  const session = await auth();
  if (session?.user) redirect({ href: "/dashboard", locale });
  return <AuthForm mode="sign-in" googleEnabled={googleEnabled} oauthError={error?.slice(0, 40)} />;
}
