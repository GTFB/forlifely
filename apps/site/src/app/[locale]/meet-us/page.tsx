import type { Metadata } from "next";
import { MeetUsClient } from "@/components/pages/MeetUsClient";
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
    getTranslationValue(translations, "pages.meet_us.title") || "Meet Lifely";
  const description =
    getTranslationValue(translations, "pages.meet_us.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function MeetUsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const translations = await getTranslations(locale);
  const title =
    getTranslationValue(translations, "pages.meet_us.title") || "Meet Lifely";
  const description = getTranslationValue(
    translations,
    "pages.meet_us.description",
  );

  return (
    <MeetUsClient title={title} description={description ?? undefined} />
  );
}
