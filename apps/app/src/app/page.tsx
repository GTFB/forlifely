import { Banner4 } from "@/components/pages/Home/banner4";
import { Navbar8 } from "@/components/pages/Home/navbar8";
import { HomeClient, type HomeContent } from "@/components/pages/HomeClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";

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
  const g = (key: string) => getTranslationValue(translations, key) ?? "";

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

export default async function Home() {
  const translations = await getTranslations();
  const homeContent = buildHomeContent(translations);
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
    <>
      <div className="sticky top-0 z-500 w-full">
        <Banner4 title={bannerLabels.title} description={bannerLabels.description} />
        <Navbar8 localePath="" labels={navLabels} />
      </div>
      <HomeClient homeContent={homeContent} />
    </>
  );
}
