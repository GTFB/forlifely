import type { Metadata } from "next";
import { LoyaltyProgramClient } from "@/components/pages/LoyaltyProgramClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.loyalty_program.title") || "Loyalty Program";
  const description = getTranslationValue(translations, "pages.loyalty_program.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function LoyaltyProgramPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.loyalty_program.title") || "Loyalty Program";
  const description = getTranslationValue(translations, "pages.loyalty_program.description") || "";

  return <LoyaltyProgramClient title={title} description={description} />;
}
