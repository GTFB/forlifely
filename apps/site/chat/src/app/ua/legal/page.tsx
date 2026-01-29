import { LegalListPageClient } from "./page-client";
import { buildRequestEnv } from "@/shared/env";
import { TextsRepository } from "@/shared/repositories/texts.repository";
import { parseJson } from "@/shared/repositories/utils";

export const dynamic = 'force-dynamic';

export default async function LegalListPage() {
  try {
    const env = buildRequestEnv();
    
    if (!env.DB) {
      throw new Error('Database binding is not configured');
    }

    const repository = TextsRepository.getInstance(env.DB);
    
    // Get all legal documents
    const filterConditions = [
      {
        field: 'type',
        operator: 'eq' as const,
        values: ['legal'],
      },
    ];

    const filters = {
      conditions: filterConditions,
    };

    const orders = {
      orders: [
        { field: 'order', direction: 'asc' as const },
      ],
    };

    const pagination = {
      page: 1,
      limit: 100,
    };

    const result = await repository.getFiltered(filters, orders, pagination);

    // Filter by published status and isPublic
    let documents = result.docs.filter((text) => {
      const status = text.statusName?.toLowerCase();
      return status === 'published' && (text.isPublic === true || text.isPublic == null);
    });

    // Parse documents
    const parsedDocuments = documents
      .filter((text) => text.uuid !== null) // Filter out documents without uuid
      .map((text) => {
        const dataIn = parseJson<Record<string, unknown>>(text.dataIn, {});
        
        // Parse title - it may be JSON string (multilingual) or plain string
        let parsedTitle: string | { en: string; ru: string } = text.title || '';
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
        
        return {
          id: text.id,
          uuid: text.uuid!, // Non-null assertion since we filtered nulls
          title: parsedTitle,
          slug: (dataIn.slug as string) || '',
          createdAt: text.createdAt ? new Date(text.createdAt).toISOString() : undefined,
        };
      });

    return <LegalListPageClient documents={parsedDocuments} />;
  } catch (error) {
    console.error('Error fetching legal documents:', error);
    return <LegalListPageClient documents={[]} />;
  }
}

