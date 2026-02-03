import type { Metadata } from "next";
import { CatalogClient } from "@/components/pages/CatalogClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.catalog.title") || "Product Catalog";
  const description = getTranslationValue(translations, "pages.catalog.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function CatalogPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.catalog.title") || "Product Catalog";
  const description = getTranslationValue(translations, "pages.catalog.description") || "";

  return <CatalogClient title={title} description={description} />;
}
