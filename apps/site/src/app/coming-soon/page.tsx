import type { Metadata } from "next";
import { ComingSoonClient } from "@/components/pages/ComingSoonClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.coming_soon.title") || "Coming Soon";
  const description = getTranslationValue(translations, "pages.coming_soon.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function ComingSoonPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.coming_soon.title") || "Coming Soon";
  const description = getTranslationValue(translations, "pages.coming_soon.description") || "";

  return <ComingSoonClient title={title} description={description} />;
}
