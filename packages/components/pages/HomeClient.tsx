"use client";

import HeroSection from "@/components/blocks-marketing/hero-section";
import HowItWorksSection from "@/components/blocks-marketing/how-it-works-section";
import BenefitsSection from "@/components/blocks-marketing/benefits-section";
import { LogoCloud } from "@/components/blocks-marketing/logo-cloud";
import Testimonials from "@/components/blocks-marketing/testimonials";
import FooterSection from "@/components/blocks-marketing/footer";

export function HomeClient() {
  return (
    <div className="flex-1">
      <HeroSection />
      <HowItWorksSection />
      <BenefitsSection />
      <LogoCloud />
      <Testimonials />
      <FooterSection />
    </div>
  );
}
