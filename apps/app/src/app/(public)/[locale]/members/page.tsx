import type { Metadata } from "next";
import type { Feature170Content } from "@/components/pages/Members/feature170";
import type { Feature183Content } from "@/components/pages/Members/feature183";
import type { Feature62Content } from "@/components/pages/Members/feature62";
import type { Hero91Content } from "@/components/pages/Members/hero91";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";
import { PUBLIC_PAGES_COMPONENTS } from "@/app-public-components";
import { notFound } from "next/navigation";

function buildMembersHero(translations: Record<string, unknown>): Hero91Content | undefined {
  const pages = translations?.pages as Record<string, unknown> | undefined;
  const members = pages?.members as Record<string, unknown> | undefined;
  const heroBlock = members?.hero as Record<string, string> | undefined;
  if (!heroBlock?.title) return undefined;
  return {
    title: heroBlock.title,
    description: heroBlock.description ?? "",
    button1: heroBlock.button1 ?? "",
    button2: heroBlock.button2 ?? "",
    imageSrc: heroBlock.imageSrc,
  };
}

function buildMembersFeature62(translations: Record<string, unknown>): Feature62Content | undefined {
  const pages = translations?.pages as Record<string, unknown> | undefined;
  const members = pages?.members as Record<string, unknown> | undefined;
  const block = members?.feature62 as Record<string, unknown> | undefined;
  if (!block?.heading) return undefined;
  const items = block.items as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(items) || items.length === 0) return undefined;
  return {
    heading: String(block.heading),
    description: String(block.description ?? ""),
    items: items.map((item) => ({
      imageSrc: String(item.imageSrc ?? ""),
      title: String(item.title ?? ""),
      description: String(item.description ?? ""),
      imageRight: Boolean(item.imageRight),
    })),
  };
}

function buildMembersFeature170(translations: Record<string, unknown>): Feature170Content | undefined {
  const pages = translations?.pages as Record<string, unknown> | undefined;
  const members = pages?.members as Record<string, unknown> | undefined;
  const block = members?.feature170 as Record<string, unknown> | undefined;
  if (!block?.heading) return undefined;
  const cards = block.cards as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(cards) || cards.length === 0) return undefined;
  return {
    heading: String(block.heading),
    description: String(block.description ?? ""),
    cards: cards.map((card) => {
      const bullets = (card.bullets as Array<Record<string, string>>) ?? [];
      return {
        title: String(card.title ?? ""),
        description: String(card.description ?? ""),
        bullets: bullets.map((b) => ({ bold: String(b?.bold ?? ""), text: String(b?.text ?? "") })),
      };
    }),
  };
}

function buildMembersFeature183(translations: Record<string, unknown>): Feature183Content | undefined {
  const pages = translations?.pages as Record<string, unknown> | undefined;
  const members = pages?.members as Record<string, unknown> | undefined;
  const block = members?.feature183 as Record<string, unknown> | undefined;
  if (!block?.heading) return undefined;
  const steps = block.steps as Array<Record<string, string>> | undefined;
  if (!Array.isArray(steps) || steps.length !== 3) return undefined;
  return {
    heading: String(block.heading),
    description: String(block.description ?? ""),
    subtitle: block.subtitle != null ? String(block.subtitle) : undefined,
    subtitleDescription: block.subtitleDescription != null ? String(block.subtitleDescription) : undefined,
    steps: [
      { title: String(steps[0]?.title ?? ""), description: String(steps[0]?.description ?? "") },
      { title: String(steps[1]?.title ?? ""), description: String(steps[1]?.description ?? "") },
      { title: String(steps[2]?.title ?? ""), description: String(steps[2]?.description ?? "") },
    ],
    buttonLabel: String(block.buttonLabel ?? ""),
    buttonHref: block.buttonHref != null ? String(block.buttonHref) : undefined,
    imageSrc: block.imageSrc != null ? String(block.imageSrc) : undefined,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const translations = await getTranslations();
  const title =
    getTranslationValue(translations, "pages.members.title") ||
    "Feel supported with Lifely";
  const description =
    getTranslationValue(translations, "pages.members.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function MembersPage() {
  if (!PUBLIC_PAGES_COMPONENTS.members) {
    notFound();
  }
  const translations = await getTranslations();
  const title =
    getTranslationValue(translations, "pages.members.title") ||
    "Feel supported with Lifely";
  const description = getTranslationValue(
    translations,
    "pages.members.description",
  );
  const hero = buildMembersHero(translations as Record<string, unknown>);
  const feature62 = buildMembersFeature62(translations as Record<string, unknown>);
  const feature170 = buildMembersFeature170(translations as Record<string, unknown>);
  const feature183 = buildMembersFeature183(translations as Record<string, unknown>);

  return (
    <PUBLIC_PAGES_COMPONENTS.members
      title={title}
      description={description ?? undefined}
      hero={hero}
      feature62={feature62}
      feature170={feature170}
      feature183={feature183}
    />
  );
}
