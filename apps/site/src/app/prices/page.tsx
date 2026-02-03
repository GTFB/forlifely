import type { Metadata } from "next";
import { PricesClient } from "@/components/pages/PricesClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.prices.title") || "Pricing";
  const description = getTranslationValue(translations, "pages.prices.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function PricesPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.prices.title") || "Pricing";
  const description = getTranslationValue(translations, "pages.prices.description") || "";

  return <PricesClient title={title} description={description} />;
}
