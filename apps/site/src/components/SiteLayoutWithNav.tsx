"use client";

import { useAltrpLocale } from "@/contexts/LocaleContext";
import { Banner4 } from "@/components/pages/Home/banner4";
import { Navbar8, type Navbar8Labels } from "@/components/pages/Home/navbar8";

export interface NavLabels extends Navbar8Labels {}

export interface BannerLabels {
  title?: string;
  description?: string;
}

export function SiteLayoutWithNav({
  children,
  navLabels,
  bannerLabels,
}: {
  children: React.ReactNode;
  navLabels?: NavLabels;
  bannerLabels?: BannerLabels;
}) {
  const { localePath } = useAltrpLocale();

  return (
    <>
      <div className="sticky top-0 z-500 w-full">
        <Banner4 title={bannerLabels?.title} description={bannerLabels?.description} />
        <Navbar8 localePath={localePath} labels={navLabels} />
      </div>
      {children}
    </>
  );
}
