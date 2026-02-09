"use client";

import FooterSection from "@/components/blocks-marketing/footer";
import { Container } from "@/components/blocks-marketing/Container";

interface MembersClientProps {
  title: string;
  description?: string;
}

export function MembersClient({ title, description }: MembersClientProps) {
  return (
    <div className="flex-1">
      <section className="pt-24 pb-16 md:py-32">
        <Container>
          <h1 className="mb-8 text-4xl font-medium md:text-5xl">{title}</h1>
          {description && (
            <p className="mb-8 text-lg text-muted-foreground">{description}</p>
          )}
          <div className="prose prose-lg max-w-none">
            <p>Feel supported with Lifely. Content coming soon.</p>
          </div>
        </Container>
      </section>
      <FooterSection />
    </div>
  );
}
