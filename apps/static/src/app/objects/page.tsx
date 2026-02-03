import type { Metadata } from "next";
import { ObjectsClient } from "@/components/pages/ObjectsClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.objects.title") || "Objects";
  const description = getTranslationValue(translations, "pages.objects.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function ObjectsPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.objects.title") || "Objects";
  const description = getTranslationValue(translations, "pages.objects.description") || "";

  return <ObjectsClient title={title} description={description} />;
}
