import type { Metadata } from "next";
import { EventsClient } from "@/components/pages/EventsClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.events.title") || "Events";
  const description = getTranslationValue(translations, "pages.events.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function EventsPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.events.title") || "Events";
  const description = getTranslationValue(translations, "pages.events.description") || "";

  return <EventsClient title={title} description={description} />;
}
