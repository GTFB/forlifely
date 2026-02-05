import type { Metadata } from "next";
import { PUBLIC_PAGES_COMPONENTS } from "@/app-public-components";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";
import { getContent } from "@/lib/get-content";
import { notFound } from "next/navigation";

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
  if (!PUBLIC_PAGES_COMPONENTS.blog) {
    notFound();
  }
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.blog.title") || "Blog";
  const description = getTranslationValue(translations, "pages.blog.description") || "";
  const blogPosts = await getContent('blog');

  return <PUBLIC_PAGES_COMPONENTS.blog title={title} description={description} blogPosts={blogPosts} />;
}
