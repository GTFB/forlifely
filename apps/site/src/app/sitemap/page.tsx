import type { Metadata } from "next";
import { SitemapClient } from "@/components/pages/SitemapClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.sitemap.title") || "Sitemap";
  const description = getTranslationValue(translations, "pages.sitemap.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function SitemapPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.sitemap.title") || "Sitemap";
  const description = getTranslationValue(translations, "pages.sitemap.description") || "";

  return <SitemapClient title={title} description={description} />;
}
