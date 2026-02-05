import type { Metadata } from "next";
import { SignUpClient } from "@/components/pages/SignUpClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.sign_up.title") || "Sign Up";
  const description = getTranslationValue(translations, "pages.sign_up.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function SignUpPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.sign_up.title") || "Sign Up";
  const description = getTranslationValue(translations, "pages.sign_up.description") || "";

  return <SignUpClient title={title} description={description} />;
}
