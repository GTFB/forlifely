import type { Metadata } from "next";
import { PromotionsClient } from "@/components/pages/PromotionsClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.promotions.title") || "Promotions & Special Offers";
  const description = getTranslationValue(translations, "pages.promotions.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function PromotionsPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.promotions.title") || "Promotions & Special Offers";
  const description = getTranslationValue(translations, "pages.promotions.description") || "";

  return <PromotionsClient title={title} description={description} />;
}
