import type { Metadata } from "next";
import type { HomeContent } from "@/components/pages/HomeClient";
import { HomeClient } from "@/components/pages/HomeClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

const HOME_KEYS = {
  hero: {
    title: "pages.home.hero.title",
    description: "pages.home.hero.description",
    button1: "pages.home.hero.button1",
    button2: "pages.home.hero.button2",
    subtitle: "pages.home.hero.subtitle",
  },
  feature: {
    heading: "pages.home.feature.heading",
    description: "pages.home.feature.description",
    card_members_title: "pages.home.feature.card_members_title",
    card_members_description: "pages.home.feature.card_members_description",
    card_members_button: "pages.home.feature.card_members_button",
    card_mentors_title: "pages.home.feature.card_mentors_title",
    card_mentors_description: "pages.home.feature.card_mentors_description",
    card_mentors_button: "pages.home.feature.card_mentors_button",
  },
  how_it_works: {
    heading: "pages.home.how_it_works.heading",
    description: "pages.home.how_it_works.description",
    step1_title: "pages.home.how_it_works.step1_title",
    step1_description: "pages.home.how_it_works.step1_description",
    step2_title: "pages.home.how_it_works.step2_title",
    step2_description: "pages.home.how_it_works.step2_description",
    step3_title: "pages.home.how_it_works.step3_title",
    step3_description: "pages.home.how_it_works.step3_description",
    button: "pages.home.how_it_works.button",
  },
} as const;

function buildHomeContent(translations: Record<string, unknown>): HomeContent {
  const g = (key: string) =>
    getTranslationValue(translations, key) ?? "";

  return {
    hero: {
      title: g(HOME_KEYS.hero.title),
      description: g(HOME_KEYS.hero.description),
      button1: g(HOME_KEYS.hero.button1),
      button2: g(HOME_KEYS.hero.button2),
      subtitle: g(HOME_KEYS.hero.subtitle) || undefined,
    },
    feature: {
      heading: g(HOME_KEYS.feature.heading),
      description: g(HOME_KEYS.feature.description),
      cardMembers: {
        title: g(HOME_KEYS.feature.card_members_title),
        description: g(HOME_KEYS.feature.card_members_description),
        button: g(HOME_KEYS.feature.card_members_button),
      },
      cardMentors: {
        title: g(HOME_KEYS.feature.card_mentors_title),
        description: g(HOME_KEYS.feature.card_mentors_description),
        button: g(HOME_KEYS.feature.card_mentors_button),
      },
    },
    howItWorks: {
      heading: g(HOME_KEYS.how_it_works.heading),
      description: g(HOME_KEYS.how_it_works.description),
      steps: [
        {
          title: g(HOME_KEYS.how_it_works.step1_title),
          description: g(HOME_KEYS.how_it_works.step1_description),
        },
        {
          title: g(HOME_KEYS.how_it_works.step2_title),
          description: g(HOME_KEYS.how_it_works.step2_description),
        },
        {
          title: g(HOME_KEYS.how_it_works.step3_title),
          description: g(HOME_KEYS.how_it_works.step3_description),
        },
      ],
      buttonLabel: g(HOME_KEYS.how_it_works.button),
      buttonHref: "/about",
    },
  };
}

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  const translations = await getTranslations(locale);
  const title = getTranslationValue(translations, "pages.home.title") || "Home";
  const description = getTranslationValue(translations, "pages.home.description") || PROJECT_SETTINGS.description;
  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const translations = await getTranslations(locale);
  const homeContent = buildHomeContent(translations);
  return <HomeClient homeContent={homeContent} />;
}
