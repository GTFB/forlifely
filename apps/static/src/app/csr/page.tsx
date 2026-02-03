import type { Metadata } from "next";
import { CSRClient } from "@/components/pages/CSRClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.csr.title") || "Corporate Social Responsibility";
  const description = getTranslationValue(translations, "pages.csr.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function CSRPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.csr.title") || "Corporate Social Responsibility";
  const description = getTranslationValue(translations, "pages.csr.description") || "";

  return <CSRClient title={title} description={description} />;
}
