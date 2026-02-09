import type { Metadata } from "next";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";
import { PUBLIC_PAGES_COMPONENTS } from "@/app-public-components";
import { notFound } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title =
    getTranslationValue(translations, "pages.mentors.title") ||
    "Lifely for Mentors";
  const description =
    getTranslationValue(translations, "pages.mentors.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function MentorsPage() {
  if (!PUBLIC_PAGES_COMPONENTS.mentors) {
    notFound();
  }
  const translations = await getTranslations();
  const title =
    getTranslationValue(translations, "pages.mentors.title") ||
    "Lifely for Mentors";
  const description = getTranslationValue(
    translations,
    "pages.mentors.description",
  );

  return (
    <PUBLIC_PAGES_COMPONENTS.mentors
      title={title}
      description={description ?? undefined}
    />
  );
}
