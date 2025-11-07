"use client";

import * as React from "react";
import { HeroHeader } from "@/components/home/header";
import HeroSection from "@/components/home/hero-section";
import AudienceSegments from "@/components/home/audience-segments";
import { LogoCloud } from "@/components/home/logo-cloud";
import InstallmentCalculator from "@/components/marketing-blocks/installment-calculator";
import FeaturesSection from "@/components/home/features";
import Testimonials from "@/components/home/testimonials";
import FooterSection from "@/components/marketing-blocks/footer";
export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
      <div className="flex-1">
        <HeroHeader />
        <HeroSection />
        <AudienceSegments />
        <InstallmentCalculator />
        <LogoCloud />
        <FeaturesSection />
        <Testimonials />
        <FooterSection />
      </div>
  );
}
