import type { Metadata } from "next";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";
import { PUBLIC_PAGES_COMPONENTS } from "@/app-public-components";
import { notFound } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title =
    getTranslationValue(translations, "pages.meet_us.title") || "Meet Lifely";
  const description =
    getTranslationValue(translations, "pages.meet_us.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function MeetUsPage() {
  if (!PUBLIC_PAGES_COMPONENTS["meet-us"]) {
    notFound();
  }
  const translations = await getTranslations();
  const title =
    getTranslationValue(translations, "pages.meet_us.title") || "Meet Lifely";
  const description = getTranslationValue(
    translations,
    "pages.meet_us.description",
  );

  const MeetUsPageComponent = PUBLIC_PAGES_COMPONENTS["meet-us"];
  return (
    <MeetUsPageComponent
      title={title}
      description={description ?? undefined}
    />
  );
}
