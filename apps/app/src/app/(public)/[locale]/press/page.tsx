import type { Metadata } from "next";
import { PressClient } from "@/components/pages/PressClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.press.title") || "Press";
  const description = getTranslationValue(translations, "pages.press.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function PressPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.press.title") || "Press";
  const description = getTranslationValue(translations, "pages.press.description") || "";

  return <PressClient title={title} description={description} />;
}
