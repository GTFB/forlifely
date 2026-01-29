import type { D1Database } from "@cloudflare/workers-types";
import { and, eq, sql } from "drizzle-orm";
import { schema } from "../schema";
import type { Text } from "../schema/types";
import BaseRepository from "./BaseRepositroy";
import type { DbFilters, DbOrders, DbPagination, DbPaginatedResult } from "../types/shared";
import { SiteDb, withNotDeleted } from "./utils";

export class TextsRepository extends BaseRepository<Text> {
  private static instance: TextsRepository | null = null;

  private constructor(db: D1Database | SiteDb) {
    super(db, schema.texts);
  }

  public static getInstance(db: D1Database | SiteDb): TextsRepository {
    if (!TextsRepository.instance) {
      TextsRepository.instance = new TextsRepository(db);
    }
    return TextsRepository.instance;
  }

  async getFiltered(filters: DbFilters, orders: DbOrders, pagination: DbPagination): Promise<DbPaginatedResult<Text>> {
    // Add deletedAt filter automatically
    const conditionsWithDeleted = [
      {
        field: 'deletedAt',
        operator: 'isNull' as const,
        values: [] as never[],
      },
      ...(filters.conditions || []),
    ];

    const filtersWithDeleted = {
      conditions: conditionsWithDeleted,
    };

    return super.getFiltered(filtersWithDeleted, orders, pagination);
  }

  async findBySlugAndType(slug: string, type: string): Promise<Text | null> {
    // Primary lookup: use JSONB extraction (works when column stores JSON/JSONB or valid JSON string)
    const [document] = await this.db
      .select()
      .from(schema.texts)
      .where(
        withNotDeleted(
          schema.texts.deletedAt,
          and(
            eq(schema.texts.type, type),
            // Cast to JSONB to avoid operator errors when stored as text
            sql`(${schema.texts.dataIn})::jsonb ->> 'slug' = ${slug}`
          )
        )
      )
      .limit(1)
      .execute();
      
    if (document) {
      return document;
    }

    // Fallback 1: handle cases where data_in is stored as plain text with escaped JSON
    const pattern = `%\\\\"slug\\\\":\\\\"${slug}\\\\"%`;
    const [fallback] = await this.db
      .select()
      .from(schema.texts)
      .where(
        withNotDeleted(
          schema.texts.deletedAt,
          and(
            eq(schema.texts.type, type),
            sql`(${schema.texts.dataIn})::text ILIKE ${pattern}`
          )
        )
      )
      .limit(1)
      .execute();

    return fallback ?? null;
  }
}

