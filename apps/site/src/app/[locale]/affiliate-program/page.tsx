import type { Metadata } from "next";
import { AffiliateProgramClient } from "@/components/pages/AffiliateProgramClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.affiliate_program.title") || "Affiliate Program";
  const description = getTranslationValue(translations, "pages.affiliate_program.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function AffiliateProgramPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.affiliate_program.title") || "Affiliate Program";
  const description = getTranslationValue(translations, "pages.affiliate_program.description") || "";

  return <AffiliateProgramClient title={title} description={description} />;
}
