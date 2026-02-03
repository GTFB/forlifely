import type { Metadata } from "next";
import { CartClient } from "@/components/pages/CartClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.cart.title") || "Shopping Cart";
  const description = getTranslationValue(translations, "pages.cart.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function CartPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.cart.title") || "Shopping Cart";
  const description = getTranslationValue(translations, "pages.cart.description") || "";

  return <CartClient title={title} description={description} />;
}
