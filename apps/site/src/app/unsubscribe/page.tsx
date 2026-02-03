import type { Metadata } from "next";
import { UnsubscribeClient } from "@/components/pages/UnsubscribeClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.unsubscribe.title") || "Unsubscribe";
  const description = getTranslationValue(translations, "pages.unsubscribe.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function UnsubscribePage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.unsubscribe.title") || "Unsubscribe";
  const description = getTranslationValue(translations, "pages.unsubscribe.description") || "";

  return <UnsubscribeClient title={title} description={description} />;
}
