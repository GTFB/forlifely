import type { Metadata } from "next";
import { WholesaleClient } from "@/components/pages/WholesaleClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.wholesale.title") || "Wholesale";
  const description = getTranslationValue(translations, "pages.wholesale.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function WholesalePage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.wholesale.title") || "Wholesale";
  const description = getTranslationValue(translations, "pages.wholesale.description") || "";

  return <WholesaleClient title={title} description={description} />;
}
