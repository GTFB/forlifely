import type { Metadata } from "next";
import { SignInClient } from "@/components/pages/SignInClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.sign_in.title") || "Sign In";
  const description = getTranslationValue(translations, "pages.sign_in.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function SignInPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.sign_in.title") || "Sign In";
  const description = getTranslationValue(translations, "pages.sign_in.description") || "";

  return <SignInClient title={title} description={description} />;
}
