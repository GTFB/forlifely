import type { Metadata } from "next";
import { WishlistClient } from "@/components/pages/WishlistClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.wishlist.title") || "Wishlist";
  const description = getTranslationValue(translations, "pages.wishlist.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function WishlistPage() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.wishlist.title") || "Wishlist";
  const description = getTranslationValue(translations, "pages.wishlist.description") || "";

  return <WishlistClient title={title} description={description} />;
}
