"use client";

import * as React from "react";
import HeroSection from "@/components/home/hero-section";
import AudienceSegments from "@/components/home/audience-segments";
import { LogoCloud } from "@/components/home/logo-cloud";
import FeaturesSection from "@/components/home/features";
import Testimonials from "@/components/home/testimonials";
import FooterSection from "@/components/marketing-blocks/footer";
export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
      <div className="flex-1">
        <HeroSection />
        <AudienceSegments />
        <LogoCloud />
        <FeaturesSection />
        <Testimonials />
        <FooterSection />
      </div>
  );
}
