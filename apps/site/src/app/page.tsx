"use client";

import * as React from "react";
import HeroSection from "@/components/home/hero-section";
import AudienceSegments from "@/components/home/audience-segments";
import { LogoCloud } from "@/components/home/logo-cloud";
import InstallmentCalculator from "@/components/marketing-blocks/installment-calculator";
import FeaturesSection from "@/components/home/features";
import Testimonials from "@/components/home/testimonials";
import FooterSection from "@/components/marketing-blocks/footer";

export default function Home() {
  return (
    <div className="flex-1">
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
