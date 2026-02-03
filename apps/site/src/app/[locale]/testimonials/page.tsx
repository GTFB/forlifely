import type { Metadata } from "next";
import { TestimonialsClient } from "@/components/pages/TestimonialsClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.testimonials.title") || "Testimonials";
  const description = getTranslationValue(translations, "pages.testimonials.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function TestimonialsPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.testimonials.title") || "Testimonials";
  const description = getTranslationValue(translations, "pages.testimonials.description") || "";

  return <TestimonialsClient title={title} description={description} />;
}
