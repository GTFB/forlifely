import type { Metadata } from "next";
import { HomeClient } from "@/components/pages/HomeClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";


export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params
  const translations = await getTranslations(locale);
  const title = getTranslationValue(translations, "pages.home.title") || "Home";
  const description = getTranslationValue(translations, "pages.home.description") || PROJECT_SETTINGS.description;
  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default function Home() {
  return <HomeClient />;
}
