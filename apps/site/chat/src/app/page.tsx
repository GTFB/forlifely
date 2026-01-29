import { MainLayout } from "@/components/layouts/main-layout";
import { HeroNeuro } from "@/components/home/hero-neuro";
import { Logos3 } from "@/components/home/logos3";
import { FeatureNeuro } from "@/components/home/feature-neuro";
import { TechnologyRag } from "@/components/home/technology-rag";
import { AnalyticsTrendwatcher } from "@/components/home/analytics-trendwatcher";
import { Gallery1 } from "@/components/home/gallery1";
import { Pricing26 } from "@/components/home/pricing26";
import { Faq8 } from "@/components/home/faq8";
import { Cta14 } from "@/components/home/cta14";

export default function Home() {
  return (
    <MainLayout>
      <div className="flex flex-col">
        <HeroNeuro />
        <Logos3 />
        <FeatureNeuro />
        <TechnologyRag />
        <AnalyticsTrendwatcher />
        <Gallery1 />
        <Pricing26 />
        <Faq8 />
        <Cta14 />
      </div>
    </MainLayout>
  );
}
