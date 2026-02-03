import type { Metadata } from "next";
import { VideoClient } from "@/components/pages/VideoClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.video.title") || "Video Reviews";
  const description = getTranslationValue(translations, "pages.video.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function VideoPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.video.title") || "Video Reviews";
  const description = getTranslationValue(translations, "pages.video.description") || "";

  return <VideoClient title={title} description={description} />;
}
