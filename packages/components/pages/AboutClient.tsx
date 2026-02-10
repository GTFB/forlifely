"use client";

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
      {/* Mission Section */}
      <section className="pt-24 py-16 md:py-32">
        <Container>
          <h1 className="text-4xl md:text-5xl font-medium mb-8">{title}</h1>
        </Container>
      </section>

    </div>
  );
}
