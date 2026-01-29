"use client";

import { MainLayout } from "@/components/layouts/main-layout";
import { LegalDocument } from "@/components/legal/legal-document";

type MultilingualContent = {
  en: string;
  ru: string;
};

export interface LegalDocumentData {
  content: string | MultilingualContent;
  frontmatter: {
    title: string | MultilingualContent;
    slug: string;
    category?: string;
    date?: string;
    author?: string;
  };
}

export function LegalPageClient({
  slug,
  document,
}: {
  slug: string;
  document: LegalDocumentData | null;
}) {
  return (
    <MainLayout>
      <LegalDocument slug={slug} initialDocument={document} />
    </MainLayout>
  );
}

