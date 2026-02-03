import type { Metadata } from "next";
import { JobsClient } from "@/components/pages/JobsClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.jobs.title") || "Careers";
  const description = getTranslationValue(translations, "pages.jobs.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function JobsPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.jobs.title") || "Careers";
  const description = getTranslationValue(translations, "pages.jobs.description") || "";

  return <JobsClient title={title} description={description} />;
}
