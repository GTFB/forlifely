import type { Metadata } from "next";
import { TeamClient } from "@/components/pages/TeamClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.team.title") || "Our Team";
  const description = getTranslationValue(translations, "pages.team.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function TeamPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.team.title") || "Our Team";
  const description = getTranslationValue(translations, "pages.team.description") || "";

  return <TeamClient title={title} description={description} />;
}
