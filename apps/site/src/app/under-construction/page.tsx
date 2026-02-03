import type { Metadata } from "next";
import { UnderConstructionClient } from "@/components/pages/UnderConstructionClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.under_construction.title") || "Under Construction";
  const description = getTranslationValue(translations, "pages.under_construction.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function UnderConstructionPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.under_construction.title") || "Under Construction";
  const description = getTranslationValue(translations, "pages.under_construction.description") || "";

  return <UnderConstructionClient title={title} description={description} />;
}
