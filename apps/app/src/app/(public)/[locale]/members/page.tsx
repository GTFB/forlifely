import type { Metadata } from "next";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";
import { PUBLIC_PAGES_COMPONENTS } from "@/app-public-components";
import { notFound } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
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

export default async function MembersPage() {
  if (!PUBLIC_PAGES_COMPONENTS.members) {
    notFound();
  }
  const translations = await getTranslations();
  const title =
    getTranslationValue(translations, "pages.members.title") ||
    "Feel supported with Lifely";
  const description = getTranslationValue(
    translations,
    "pages.members.description",
  );

  return (
    <PUBLIC_PAGES_COMPONENTS.members
      title={title}
      description={description ?? undefined}
    />
  );
}
