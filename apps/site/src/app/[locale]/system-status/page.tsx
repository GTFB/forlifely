import type { Metadata } from "next";
import { SystemStatusClient } from "@/components/pages/SystemStatusClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.system_status.title") || "System Status";
  const description = getTranslationValue(translations, "pages.system_status.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function SystemStatusPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.system_status.title") || "System Status";
  const description = getTranslationValue(translations, "pages.system_status.description") || "";

  return <SystemStatusClient title={title} description={description} />;
}
