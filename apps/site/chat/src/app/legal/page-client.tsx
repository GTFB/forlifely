"use client";

import Link from "next/link";
import { MainLayout } from "@/components/layouts/main-layout";
import { Container } from "@/components/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/hooks/use-locale";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { FileText } from "lucide-react";

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

interface LegalDocument {
  id: number;
  uuid: string;
  title: string | MultilingualContent;
  slug: string;
  createdAt?: string;
}

interface LegalListPageClientProps {
  documents: LegalDocument[];
}

export function LegalListPageClient({ documents }: LegalListPageClientProps) {
  const { locale } = useLocale();
  const currentLocale = locale || 'en';
  return (
    <MainLayout>
      <div className="py-12 lg:py-16">
        <Container>
          <Breadcrumb className="mb-8">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Legal Documents</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Legal Documents</h1>
            <p className="text-muted-foreground">
              Review our legal documents and policies
            </p>
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Documents not found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {documents.map((doc) => (
                <Link key={doc.id} href={`/legal/${doc.slug}`}>
                  <Card className="h-full transition-all duration-300 hover:shadow-lg cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <CardTitle className="text-lg line-clamp-2">
                          {parseMultilingual(doc.title, currentLocale)}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {doc.createdAt && (
                        <p className="text-sm text-muted-foreground">
                          Updated: {new Date(doc.createdAt).toLocaleDateString(currentLocale === 'en' ? 'en-US' : 'ru-RU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </div>
    </MainLayout>
  );
}

