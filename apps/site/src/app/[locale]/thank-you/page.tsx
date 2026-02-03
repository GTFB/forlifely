import type { Metadata } from "next";
import { ThankYouClient } from "@/components/pages/ThankYouClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.thank_you.title") || "Thank You";
  const description = getTranslationValue(translations, "pages.thank_you.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function ThankYouPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.thank_you.title") || "Thank You";
  const description = getTranslationValue(translations, "pages.thank_you.description") || "";

  return <ThankYouClient title={title} description={description} />;
}
