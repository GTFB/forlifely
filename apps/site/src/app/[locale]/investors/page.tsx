import type { Metadata } from "next";
import { InvestorsClient } from "@/components/pages/InvestorsClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.investors.title") || "For Investors";
  const description = getTranslationValue(translations, "pages.investors.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function InvestorsPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.investors.title") || "For Investors";
  const description = getTranslationValue(translations, "pages.investors.description") || "";

  return <InvestorsClient title={title} description={description} />;
}
