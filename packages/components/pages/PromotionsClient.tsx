"use client";

import { HeroHeader } from "@/components/blocks-marketing/header";
import FooterSection from "@/components/blocks-marketing/footer";
import { Container } from "@/components/blocks-marketing/Container";

interface PromotionsClientProps {
  title: string;
  description?: string;
}

export function PromotionsClient({ title, description }: PromotionsClientProps) {
  return (
    <div className="flex-1">
      <HeroHeader />
      <section className="pt-24 py-16 md:py-32">
        <Container>
          <h1 className="text-4xl md:text-5xl font-medium mb-8">{title}</h1>
          {description && (
            <p className="text-lg text-muted-foreground mb-8">{description}</p>
          )}
          <div className="prose prose-lg max-w-none">
            <p>Content coming soon...</p>
          </div>
        </Container>
      </section>
      <FooterSection />
    </div>
  );
}
