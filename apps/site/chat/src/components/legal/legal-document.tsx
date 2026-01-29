"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/Container";
import { MDXRenderer } from "@/packages/components/misc/mdx-renderer";
import { useLocale } from "@/hooks/use-locale";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type MultilingualContent = {
  en: string;
  ru: string;
};

function parseMultilingual(content: string | MultilingualContent | null | undefined, locale: string): string {
  if (!content) return '';
  
  // If it's already a string, try to parse as JSON
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed[locale] || parsed.en || parsed.ru || '';
      }
      return parsed;
    } catch {
      // If parsing fails, return as is
      return content;
    }
  }
  
  // If it's already an object
  if (typeof content === 'object') {
    return content[locale as keyof MultilingualContent] || content.en || content.ru || '';
  }
  
  return '';
}

export interface LegalDocumentType {
  content: string | MultilingualContent;
  frontmatter: {
    title: string | MultilingualContent;
    slug: string;
    category?: string;
    date?: string;
    author?: string;
  };
}

interface LegalDocumentProps {
  slug: string;
  initialDocument?: LegalDocumentType | null;
}

export function LegalDocument({ slug, initialDocument }: LegalDocumentProps) {
  const { locale } = useLocale();
  const currentLocale = locale || 'en';
  const document = initialDocument;

  if (!document) {
    return (
      <div className="py-12 lg:py-16">
        <Container>
          <div className="text-center">
            <p className="text-destructive">Document not found</p>
            <Link href="/">
              <Button variant="ghost" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const title = parseMultilingual(document.frontmatter.title, currentLocale);
  const content = parseMultilingual(document.content, currentLocale);

  return (
    <div className="py-12 lg:py-16">
      <Container>
        <div className="flex justify-between items-center mb-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/legal">Legal Documents</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="max-w-[150px] md:max-w-none truncate md:truncate-none">{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Link href="/legal">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{title}</h1>
          {document.frontmatter.date && (
            <p className="text-sm text-muted-foreground">
              Date: {new Date(document.frontmatter.date).toLocaleDateString(currentLocale === 'en' ? 'en-US' : 'ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <MDXRenderer
            markdownContent={content}
            mermaidCharts={[]}
          />
        </div>
      </Container>
    </div>
  );
}

