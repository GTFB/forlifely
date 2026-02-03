import type { Metadata } from "next";
import { HeroHeader } from "@/components/blocks-marketing/header";
import FooterSection from "@/components/blocks-marketing/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.not_found.title") || "Page Not Found";
  const description = getTranslationValue(translations, "pages.not_found.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function NotFound() {
  const translations = await getTranslations();
  const title = getTranslationValue(translations, "pages.not_found.title") || "Page Not Found";
  const description = getTranslationValue(translations, "pages.not_found.description") || "";
  const homeLink = getTranslationValue(translations, "navigation.home") || "Home";
  const blogLink = getTranslationValue(translations, "navigation.blog") || "Blog";

  return (
    <div className="flex-1">
      <HeroHeader />
      <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
        <div className="text-center max-w-md">
          <h1 className="text-6xl md:text-8xl font-bold mb-4">404</h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">
            {title}
          </h2>
          <p className="text-muted-foreground mb-8">
            {description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/">{homeLink}</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/blog">{blogLink}</Link>
            </Button>
          </div>
        </div>
      </div>
      <FooterSection />
    </div>
  );
}

