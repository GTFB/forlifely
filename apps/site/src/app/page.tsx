"use client";

import * as React from "react";
import HeroSection from "@/components/home/hero-section";
import FeaturesSection from "@/components/home/features";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
      <div className="flex-1">
        <HeroSection />
        <FeaturesSection />
      </div>
  );
}
