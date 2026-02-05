import type { Metadata } from "next";
import { getTranslations, getTranslationValue, getPageTranslations } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";
import { AboutClient } from "@/components/pages/AboutClient";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.about_us.title") || "About Us";
  const description = getTranslationValue(translations, "pages.about_us.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function AboutPage() {
  const translations = await getTranslations();
  const pageTranslations = await getPageTranslations("about_us");
  const title = getTranslationValue(translations, "pages.about_us.title") || "About Us";

  return (
    <AboutClient
      title={title}
      mission={pageTranslations.mission}
      values={pageTranslations.values}
      team={pageTranslations.team}
      legal={pageTranslations.legal}
    />
  );
}

