"use client";

import type { Feature183Content } from "@/components/pages/Home/feature183";
import { Feature183 } from "@/components/pages/Home/feature183";
import type { Feature27Content } from "@/components/pages/Home/feature27";
import { Feature27 } from "@/components/pages/Home/feature27";
import type { Hero91Content } from "@/components/pages/Home/hero91";
import { Hero91 } from "@/components/pages/Home/hero91";
import { Contact8 } from "@/components/pages/Home/contact8";

export interface HomeContent {
  hero: Hero91Content;
  feature: Feature27Content;
  howItWorks: Feature183Content;
}

interface HomeClientProps {
  homeContent: HomeContent;
}

export function HomeClient({ homeContent }: HomeClientProps) {
  return (
    <div className="flex-1">
      <Hero91 content={homeContent.hero} />
      <Feature27 content={homeContent.feature} />
      <Feature183 content={homeContent.howItWorks} />
      <Contact8 />
    </div>
  );
}
