"use client";

import * as React from "react";
import HeroSection from "@/components/home/hero-section";
import HowItWorksSection from "@/components/home/how-it-works-section";
import BenefitsSection from "@/components/home/benefits-section";
import { LogoCloud } from "@/components/home/logo-cloud";
import Testimonials from "@/components/home/testimonials";
import FooterSection from "@/components/marketing-blocks/footer";

export default function Home() {
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
