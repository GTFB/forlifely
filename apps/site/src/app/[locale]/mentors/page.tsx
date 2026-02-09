import type { Metadata } from "next";
import { MentorsClient } from "@/components/pages/MentorsClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const translations = await getTranslations(locale);
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

export default async function MentorsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const translations = await getTranslations(locale);
  const title =
    getTranslationValue(translations, "pages.mentors.title") ||
    "Lifely for Mentors";
  const description = getTranslationValue(
    translations,
    "pages.mentors.description",
  );

  return (
    <MentorsClient title={title} description={description ?? undefined} />
  );
}
