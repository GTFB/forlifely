import type { Metadata } from "next";
import { SearchClient } from "@/components/pages/SearchClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.search.title") || "Search Results";
  const description = getTranslationValue(translations, "pages.search.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function SearchPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.search.title") || "Search Results";
  const description = getTranslationValue(translations, "pages.search.description") || "";

  return <SearchClient title={title} description={description} />;
}
