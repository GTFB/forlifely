import { Banner4 } from "@/components/pages/Home/banner4";
import { Navbar8 } from "@/components/pages/Home/navbar8";
import { HomeClient } from "@/components/pages/HomeClient";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";

export default async function Home() {
  const translations = await getTranslations();
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
      <HomeClient />
    </>
  );
}
