import type { Metadata } from "next";
import { CertificatesClient } from "@/components/pages/CertificatesClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.certificates.title") || "Certificates & Licenses";
  const description = getTranslationValue(translations, "pages.certificates.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function CertificatesPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.certificates.title") || "Certificates & Licenses";
  const description = getTranslationValue(translations, "pages.certificates.description") || "";

  return <CertificatesClient title={title} description={description} />;
}
