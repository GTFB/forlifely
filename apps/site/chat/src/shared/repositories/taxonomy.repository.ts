import { eq, asc } from "drizzle-orm";
import type { D1Database } from "@cloudflare/workers-types";
import { schema } from "../schema";
import type { Taxonomy } from "../schema/types";
import type { DbFilters } from "../types/shared";
import { createDb, withNotDeleted, buildDbFilters, type SiteDb } from "./utils";

export class TaxonomyRepository {
  private static instance: TaxonomyRepository | null = null;
  private readonly db: SiteDb;

  private constructor(db: D1Database | SiteDb) {
    this.db = createDb(db);
  }

  public static getInstance(db: D1Database | SiteDb): TaxonomyRepository {
    if (!TaxonomyRepository.instance) {
      TaxonomyRepository.instance = new TaxonomyRepository(db);
    }
    return TaxonomyRepository.instance;
  }

  async findByEntity(entity: string, limit = 1000): Promise<Taxonomy[]> {
    return this.db
      .select()
      .from(schema.taxonomy)
      .where(withNotDeleted(
        schema.taxonomy.deletedAt,
        eq(schema.taxonomy.entity, entity)
      ))
      .orderBy(asc(schema.taxonomy.sortOrder), asc(schema.taxonomy.name))
      .limit(limit)
      .execute();
  }

  async findPaginated({ 
    page = 1, 
    limit = 20,
    entity,
    filters,
  }: { 
    page?: number; 
    limit?: number;
    entity?: string;
    filters?: DbFilters;
  }): Promise<{
    docs: Taxonomy[];
    totalDocs: number;
    limit: number;
    totalPages: number;
    page: number;
  }> {
    const offset = (page - 1) * limit;

    // Build where condition
    const filtersCondition = buildDbFilters(schema.taxonomy, filters);
    console.log('filtersCondition', filtersCondition);  
    console.log('filters', filters);

    const whereCondition = entity 
      ? withNotDeleted(schema.taxonomy.deletedAt, eq(schema.taxonomy.entity, entity), filtersCondition)
      : withNotDeleted(schema.taxonomy.deletedAt, filtersCondition);

    // Get total count
    const countResult = await this.db
      .select({ count: schema.taxonomy.id })
      .from(schema.taxonomy)
      .where(whereCondition)
      .execute();
    
    const totalDocs = countResult.length;

    // Get paginated results
    const docs = await this.db
      .select()
      .from(schema.taxonomy)
      .where(whereCondition)
      .orderBy(asc(schema.taxonomy.sortOrder), asc(schema.taxonomy.name))
      .limit(limit)
      .offset(offset)
      .execute();

    const totalPages = Math.ceil(totalDocs / limit);

    return {
      docs,
      totalDocs,
      limit,
      totalPages,
      page,
    };
  }
}
