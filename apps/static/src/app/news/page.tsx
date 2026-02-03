import type { Metadata } from "next";
import { NewsClient } from "@/components/pages/NewsClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.news.title") || "News";
  const description = getTranslationValue(translations, "pages.news.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function NewsPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.news.title") || "News";
  const description = getTranslationValue(translations, "pages.news.description") || "";

  return <NewsClient title={title} description={description} />;
}
