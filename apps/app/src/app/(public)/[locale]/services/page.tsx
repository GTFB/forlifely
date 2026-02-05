import type { Metadata } from "next";
import { ServicesClient } from "@/components/pages/ServicesClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.services.title") || "Services";
  const description = getTranslationValue(translations, "pages.services.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function ServicesPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.services.title") || "Services";
  const description = getTranslationValue(translations, "pages.services.description") || "";

  return <ServicesClient title={title} description={description} />;
}
