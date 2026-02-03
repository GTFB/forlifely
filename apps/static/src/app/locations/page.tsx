import type { Metadata } from "next";
import { LocationsClient } from "@/components/pages/LocationsClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.locations.title") || "Locations";
  const description = getTranslationValue(translations, "pages.locations.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function LocationsPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.locations.title") || "Locations";
  const description = getTranslationValue(translations, "pages.locations.description") || "";

  return <LocationsClient title={title} description={description} />;
}
