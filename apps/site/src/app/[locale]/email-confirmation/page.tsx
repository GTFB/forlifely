import type { Metadata } from "next";
import { EmailConfirmationClient } from "@/components/pages/EmailConfirmationClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.email_confirmation.title") || "Email Confirmation";
  const description = getTranslationValue(translations, "pages.email_confirmation.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function EmailConfirmationPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.email_confirmation.title") || "Email Confirmation";
  const description = getTranslationValue(translations, "pages.email_confirmation.description") || "";

  return <EmailConfirmationClient title={title} description={description} />;
}
