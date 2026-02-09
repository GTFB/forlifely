"use client";

import FooterSection from "@/components/blocks-marketing/footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Container } from "@/components/blocks-marketing/Container";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQClientProps {
  title: string;
  faq: FAQItem[];
}

export function FAQClient({ title, faq }: FAQClientProps) {
  return (
    <div className="flex-1">
      <div className="min-h-screen flex items-center justify-center px-6 pt-24 py-12">
        <Container className="w-full">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter mb-8">
            {title}
          </h1>

          <Accordion type="multiple" className="w-full">
            {faq.map((item, index) => (
              <AccordionItem key={item.question} value={`question-${index}`}>
                <AccordionTrigger className="text-left text-lg">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </div>
      <FooterSection />
    </div>
  );
}
