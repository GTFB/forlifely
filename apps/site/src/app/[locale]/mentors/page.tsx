import type { Metadata } from "next";
import { MentorsClient } from "@/components/pages/MentorsClient";
import type { Feature170Content } from "@/components/pages/Mentors/feature170";
import type { Feature183Content } from "@/components/pages/Mentors/feature183";
import type { Feature62Content } from "@/components/pages/Mentors/feature62";
import type { Hero91Content } from "@/components/pages/Mentors/hero91";
import { getTranslations, getTranslationValue } from "@/lib/get-translations";
import { PROJECT_SETTINGS } from "@/settings";

function buildMentorsHero(translations: Record<string, unknown>): Hero91Content | undefined {
  const pages = translations?.pages as Record<string, unknown> | undefined;
  const mentors = pages?.mentors as Record<string, unknown> | undefined;
  const heroBlock = mentors?.hero as Record<string, string> | undefined;
  if (!heroBlock?.title) return undefined;
  return {
    title: heroBlock.title,
    description: heroBlock.description ?? "",
    button1: heroBlock.button1 ?? "",
    button2: heroBlock.button2 ?? "",
    imageSrc: heroBlock.imageSrc,
  };
}

function buildMentorsFeature62(translations: Record<string, unknown>): Feature62Content | undefined {
  const pages = translations?.pages as Record<string, unknown> | undefined;
  const mentors = pages?.mentors as Record<string, unknown> | undefined;
  const block = mentors?.feature62 as Record<string, unknown> | undefined;
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

function buildMentorsFeature170(translations: Record<string, unknown>): Feature170Content | undefined {
  const pages = translations?.pages as Record<string, unknown> | undefined;
  const mentors = pages?.mentors as Record<string, unknown> | undefined;
  const block = mentors?.feature170 as Record<string, unknown> | undefined;
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

function buildMentorsFeature183(translations: Record<string, unknown>): Feature183Content | undefined {
  const pages = translations?.pages as Record<string, unknown> | undefined;
  const mentors = pages?.mentors as Record<string, unknown> | undefined;
  const block = mentors?.feature183 as Record<string, unknown> | undefined;
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const translations = await getTranslations(locale);
  const title =
    getTranslationValue(translations, "pages.mentors.title") ||
    "Lifely for Mentors";
  const description =
    getTranslationValue(translations, "pages.mentors.description") || "";

  return {
    title: `${title} | ${PROJECT_SETTINGS.name}`,
    description,
  };
}

export default async function MentorsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const translations = await getTranslations(locale);
  const title =
    getTranslationValue(translations, "pages.mentors.title") ||
    "Lifely for Mentors";
  const description = getTranslationValue(
    translations,
    "pages.mentors.description",
  );
  const hero = buildMentorsHero(translations as Record<string, unknown>);
  const feature62 = buildMentorsFeature62(translations as Record<string, unknown>);
  const feature170 = buildMentorsFeature170(translations as Record<string, unknown>);
  const feature183 = buildMentorsFeature183(translations as Record<string, unknown>);

  return (
    <MentorsClient
      title={title}
      description={description ?? undefined}
      hero={hero}
      feature62={feature62}
      feature170={feature170}
      feature183={feature183}
    />
  );
}
