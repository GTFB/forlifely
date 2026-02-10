"use client";

import FooterSection from "@/components/blocks-marketing/footer";
import { Container } from "@/components/blocks-marketing/Container";
import { Feature170 } from "@/components/pages/Members/feature170";
import { Feature62 } from "@/components/pages/Members/feature62";
import { Hero91 } from "@/components/pages/Members/hero91";
import type { Hero91Content } from "@/components/pages/Members/hero91";

interface MembersClientProps {
  title: string;
  description?: string;
  hero?: Hero91Content;
}

export function MembersClient({ title, description, hero }: MembersClientProps) {
  const heroContent: Hero91Content = hero ?? {
    title,
    description: description ?? "",
    button1: "",
    button2: "",
  };
  return (
    <div className="flex-1">
      <Hero91 content={heroContent} />
      <Feature170 />
      <Feature62 />
      <FooterSection />
    </div>
  );
}
