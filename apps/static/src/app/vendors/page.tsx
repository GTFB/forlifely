import type { Metadata } from "next";
import { VendorsClient } from "@/components/pages/VendorsClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.vendors.title") || "Vendors";
  const description = getTranslationValue(translations, "pages.vendors.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function VendorsPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.vendors.title") || "Vendors";
  const description = getTranslationValue(translations, "pages.vendors.description") || "";

  return <VendorsClient title={title} description={description} />;
}
