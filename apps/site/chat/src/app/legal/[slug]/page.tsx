import { LegalPageClient } from "./page-client";
import { buildRequestEnv } from "@/shared/env";
import { TextsRepository } from "@/shared/repositories/texts.repository";
import { parseJson } from "@/shared/repositories/utils";

export const dynamicParams = false;
export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  // Return known legal document slugs for static generation
  return [
    { slug: 'user-agreement' },
    { slug: 'privacy-policy' },
    { slug: 'cookie-notice' },
    { slug: 'shipping' },
    { slug: 'payment' },
    { slug: 'returns' },
  ];
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  try {
    const env = buildRequestEnv();
    
    if (!env.DB) {
      throw new Error('Database binding is not configured');
    }

    const repository = TextsRepository.getInstance(env.DB);
    const text = await repository.findBySlugAndType(slug, 'legal');

    if (!text) {
      return <LegalPageClient slug={slug} document={null} />;
    }

    // Parse dataIn if it's a string
    const dataIn = parseJson<Record<string, unknown>>(text.dataIn, {});
    
    // Parse title and content - they may be JSON strings (multilingual) or plain strings
    let parsedTitle: string | { en: string; ru: string } = text.title || '';
    let parsedContent: string | { en: string; ru: string } = text.content || '';
    
    try {
      if (typeof text.title === 'string') {
        const titleParsed = JSON.parse(text.title);
        if (typeof titleParsed === 'object' && titleParsed !== null) {
          parsedTitle = titleParsed;
        }
      }
    } catch {
      // If parsing fails, use as is (plain string)
    }
    
    try {
      if (typeof text.content === 'string') {
        const contentParsed = JSON.parse(text.content);
        if (typeof contentParsed === 'object' && contentParsed !== null) {
          parsedContent = contentParsed;
        }
      }
    } catch {
      // If parsing fails, use as is (plain string)
    }
    
    // Convert Text to LegalDocument format
    const document = {
      content: parsedContent,
      frontmatter: {
        title: parsedTitle,
        slug: (dataIn.slug as string) || slug,
        category: (dataIn.category as string) || undefined,
        date: text.createdAt ? new Date(text.createdAt).toISOString() : undefined,
        author: undefined,
      },
    };

    return <LegalPageClient slug={slug} document={document} />;
  } catch (error) {
    console.error('Error fetching legal document:', error);
    return <LegalPageClient slug={slug} document={null} />;
  }
}
