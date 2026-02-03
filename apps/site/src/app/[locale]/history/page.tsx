import type { Metadata } from "next";
import { HistoryClient } from "@/components/pages/HistoryClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.history.title") || "Company History";
  const description = getTranslationValue(translations, "pages.history.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function HistoryPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.history.title") || "Company History";
  const description = getTranslationValue(translations, "pages.history.description") || "";

  return <HistoryClient title={title} description={description} />;
}
