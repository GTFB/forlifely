import type { Metadata } from "next";
import { CompareClient } from "@/components/pages/CompareClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.compare.title") || "Compare Products";
  const description = getTranslationValue(translations, "pages.compare.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function ComparePage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.compare.title") || "Compare Products";
  const description = getTranslationValue(translations, "pages.compare.description") || "";

  return <CompareClient title={title} description={description} />;
}
