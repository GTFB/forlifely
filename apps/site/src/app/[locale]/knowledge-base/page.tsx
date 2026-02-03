import type { Metadata } from "next";
import { KnowledgeBaseClient } from "@/components/pages/KnowledgeBaseClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.knowledge_base.title") || "Knowledge Base";
  const description = getTranslationValue(translations, "pages.knowledge_base.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function KnowledgeBasePage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.knowledge_base.title") || "Knowledge Base";
  const description = getTranslationValue(translations, "pages.knowledge_base.description") || "";

  return <KnowledgeBaseClient title={title} description={description} />;
}
