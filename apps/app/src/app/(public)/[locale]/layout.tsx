import { AppLayoutWithNav } from "@/components/AppLayoutWithNav";
import { SiteLocaleProvider } from "@/contexts/LocaleContext";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { LANGUAGES } from "@/settings";

export async function generateStaticParams() {
  return LANGUAGES.map((l) => ({
    locale: l.code,
  }));
}

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
}) {
  const { locale } = await params;
  const translations = await getTranslations(locale);
  const navLabels = {
    home: getTranslationValue(translations, "navigation.home") ?? "Home",
    members: getTranslationValue(translations, "navigation.members") ?? "Feel supported with Lifely",
    mentors: getTranslationValue(translations, "navigation.mentors") ?? "Lifely for Mentors",
    meetLifely: getTranslationValue(translations, "navigation.meet_lifely") ?? "Meet Lifely",
  };
  const bannerLabels = {
    title: getTranslationValue(translations, "banner.title") ?? "We are celebrating our launch!",
    description:
      getTranslationValue(translations, "banner.description") ??
      "Get on our invite list and find the support you need.",
  };
  return (
    <SiteLocaleProvider locale={locale}>
      <AppLayoutWithNav navLabels={navLabels} bannerLabels={bannerLabels}>
        {children}
      </AppLayoutWithNav>
    </SiteLocaleProvider>
  );
}