"use client";

import { HeroHeader } from "@/components/blocks-marketing/header";
import FooterSection from "@/components/blocks-marketing/footer";
import { Shield, Users, Zap, Heart, type LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Container } from "@/components/blocks-marketing/Container";

const iconMap: Record<string, LucideIcon> = {
  Shield,
  Heart,
  Zap,
  Users,
};

interface Value {
  icon: string;
  title: string;
  description: string;
}

interface TeamMember {
  name: string;
  title: string;
  imageUrl: string;
}

interface LegalInfoContent {
  [key: string]: string | undefined;
}

interface LegalInfoItem {
  title: string;
  content: LegalInfoContent;
}

interface Mission {
  quote: string;
  paragraph1: string;
  paragraph2: string;
}

interface Values {
  title: string;
  items: Value[];
}

interface Team {
  title: string;
  description: string;
  members: TeamMember[];
}

interface Legal {
  title: string;
  items: LegalInfoItem[];
}

export interface AboutClientProps {
  title: string;
  mission: Mission;
  values: Values;
  team: Team;
  legal: Legal;
}

function renderLegalContent(content: LegalInfoContent) {
  const entries = Object.entries(content).filter(([key]) => key !== 'linkText' && key !== 'linkHref');
  const linkText = content.linkText;
  const linkHref = content.linkHref;
  
  return (
    <div className="space-y-2 text-muted-foreground">
      {entries.map(([key, value]) => (
        <p key={key}>{value}</p>
      ))}
      {linkText && linkHref && (
        <p>
          <Link href={linkHref} className="text-primary underline">
            {linkText}
          </Link>
        </p>
      )}
    </div>
  );
}

export function AboutClient({
  title,
  mission,
  values,
  team,
  legal,
}: AboutClientProps) {
  return (
    <div className="flex-1">
      <HeroHeader />
      {/* Mission Section */}
      <section className="pt-24 py-16 md:py-32">
        <Container>
          <h1 className="text-4xl md:text-5xl font-medium mb-8">{title}</h1>
          <div className="grid gap-6 md:grid-cols-2 md:gap-12">
            <blockquote className="text-2xl md:text-3xl font-medium border-l-4 border-primary pl-6">
              {mission.quote}
            </blockquote>
            <div className="space-y-6">
              <p className="text-muted-foreground">
                {mission.paragraph1}
              </p>
              <p className="text-muted-foreground">
                {mission.paragraph2}
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Values Section */}
      <section className="bg-gray-50 py-16 md:py-32 dark:bg-transparent">
        <Container>
          <h2 className="text-3xl md:text-4xl font-semibold mb-12">{values.title}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.items.map((value) => {
              const IconComponent = iconMap[value.icon];
              if (!IconComponent) return null;
              return (
                <div
                  key={value.title}
                  className="flex flex-col border rounded-xl py-6 px-5"
                >
                  <div className="mb-4 h-10 w-10 flex items-center justify-center bg-muted rounded-full">
                    <IconComponent className="size-5" />
                  </div>
                  <span className="text-lg font-semibold">{value.title}</span>
                  <p className="mt-1 text-foreground/80 text-[15px]">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Team Section */}
      <section className="py-16 md:py-32">
        <Container>
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tighter mb-4">
              {team.title}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              {team.description}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
            {team.members.map((member) => (
              <div key={member.name} className="text-center">
                <Image
                  src={member.imageUrl}
                  alt={member.name}
                  className="h-20 w-20 rounded-full object-cover mx-auto bg-secondary"
                  width={120}
                  height={120}
                />
                <h3 className="mt-4 text-lg font-semibold">{member.name}</h3>
                <p className="text-muted-foreground">{member.title}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Legal Information Section */}
      <section className="bg-gray-50 py-16 md:py-32 dark:bg-transparent">
        <Container>
          <h2 className="text-3xl md:text-4xl font-semibold mb-8">{legal.title}</h2>
          <Accordion type="multiple" className="w-full">
            {legal.items.map((item, index) => (
              <AccordionItem key={item.title} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-lg">
                  {item.title}
                </AccordionTrigger>
                <AccordionContent className="text-base">
                  {renderLegalContent(item.content)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </section>
      <FooterSection />
    </div>
  );
}
