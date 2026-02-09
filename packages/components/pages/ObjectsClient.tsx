"use client";

import FooterSection from "@/components/blocks-marketing/footer";
import { Container } from "@/components/blocks-marketing/Container";

interface ObjectsClientProps {
  title: string;
  description?: string;
}

export function ObjectsClient({ title, description }: ObjectsClientProps) {
  return (
    <div className="flex-1">
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
