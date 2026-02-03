import type { Metadata } from "next";
import { PasswordRecoveryClient } from "@/components/pages/PasswordRecoveryClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.password_recovery.title") || "Password Recovery";
  const description = getTranslationValue(translations, "pages.password_recovery.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function PasswordRecoveryPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.password_recovery.title") || "Password Recovery";
  const description = getTranslationValue(translations, "pages.password_recovery.description") || "";

  return <PasswordRecoveryClient title={title} description={description} />;
}
