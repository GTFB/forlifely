"use client";

import { HeroHeader } from "@/components/blocks-marketing/header";
import FooterSection from "@/components/blocks-marketing/footer";
import { Container } from "@/components/blocks-marketing/Container";
import { ProductList8 } from "@/components/blocks-app/product-list/product-list8";

interface CatalogClientProps {
  title: string;
  description?: string;
}

export function CatalogClient({ title, description }: CatalogClientProps) {
  return (
    <div className="flex-1">
      <HeroHeader />
        <section className="pt-24 py-16 md:py-32">
          <Container>
            <ProductList8 />
          </Container>
        </section>
      <FooterSection />
    </div>
  );
}
