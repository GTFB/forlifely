import type { Metadata } from "next";
import { ContactClient } from "@/components/pages/ContactClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.contacts.title") || "Contact Us";
  const description = getTranslationValue(translations, "pages.contacts.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function ContactPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.contacts.title") || "Contact Us";
  const description = getTranslationValue(translations, "pages.contacts.description") || "Our team is always ready to help you";

  return <ContactClient title={title} description={description} />;
}

