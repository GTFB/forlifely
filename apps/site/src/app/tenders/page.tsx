import type { Metadata } from "next";
import { TendersClient } from "@/components/pages/TendersClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.tenders.title") || "Procurement";
  const description = getTranslationValue(translations, "pages.tenders.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function TendersPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.tenders.title") || "Procurement";
  const description = getTranslationValue(translations, "pages.tenders.description") || "";

  return <TendersClient title={title} description={description} />;
}
