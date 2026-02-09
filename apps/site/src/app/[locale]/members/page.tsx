import type { Metadata } from "next";
import { MembersClient } from "@/components/pages/MembersClient";
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
    getTranslationValue(translations, "pages.members.title") ||
    "Feel supported with Lifely";
  const description =
    getTranslationValue(translations, "pages.members.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function MembersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const translations = await getTranslations(locale);
  const title =
    getTranslationValue(translations, "pages.members.title") ||
    "Feel supported with Lifely";
  const description = getTranslationValue(
    translations,
    "pages.members.description",
  );

  return (
    <MembersClient title={title} description={description ?? undefined} />
  );
}
