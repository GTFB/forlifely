import type { Metadata } from "next";
import { BlogClient } from "@/components/pages/BlogClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.blog.title") || "Blog";
  const description = getTranslationValue(translations, "pages.blog.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function BlogPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.blog.title") || "Blog";
  const description = getTranslationValue(translations, "pages.blog.description") || "";

  return <BlogClient title={title} description={description} />;
}
