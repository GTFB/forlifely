import { type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { schema } from "../schema/schema";
import {
  SQL,
  and,
  isNull,
  notInArray,
  like,
  asc,
  desc,
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  inArray,
  between,
  notBetween,
  isNotNull,
} from "drizzle-orm";
import type { DbFilters, DbOrders } from "../types/shared";
import { SiteDb } from "../db";

// We re-export SiteDb from db.ts or define it here compatible with better-sqlite3
// SiteDb is already exported from ../db.ts so we can use it.

export type { SiteDb };

export function createDb(dbInstance: any): SiteDb {
  // In the new architecture, we expect the db instance to be passed or imported.
  // If it's already the correct type, return it.
  // This function might become redundant but we keep it for compatibility during migration.
  return dbInstance as SiteDb;
}

export function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'object') {
    return value as T;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error("Failed to parse JSON from repository", error);
      return fallback;
    }
  }

  return fallback;
}

export function stringifyJson<T>(value: T | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error("Failed to stringify JSON from repository", error);
    return null;
  }
}

/**
 * Helper to add soft delete filter (deleted_at IS NULL)
 * Use with .where() or and()
 */
export function notDeleted(deletedAtColumn: any): SQL {
  return isNull(deletedAtColumn);
}

/**
 * Helper to combine conditions with soft delete filter
 */
export function withNotDeleted(deletedAtColumn: any, ...conditions: (SQL | undefined)[]): SQL {
  const validConditions = conditions.filter((c): c is SQL => c !== undefined);
  if (validConditions.length === 0) {
    return isNull(deletedAtColumn);
  }
  const combined = and(isNull(deletedAtColumn), ...validConditions);
  return combined ?? isNull(deletedAtColumn);
}

export function buildDbFilters(table: Record<string, any>, filters?: DbFilters): SQL | undefined {
  if (!filters || !filters.conditions || filters.conditions.length === 0) {
    return undefined;
  }

  const conditions: SQL[] = [];

  for (const condition of filters.conditions) {
    const column = table[condition.field];
    if (!column) {
      continue;
    }

    switch (condition.operator) {
      case "exclude": {
        if (!condition.values || condition.values.length === 0) {
          continue;
        }
        conditions.push(notInArray(column, condition.values));
        break;
      }
      case "like": {
        if (!condition.values || condition.values.length === 0) {
          continue;
        }
        const value = String(condition.values[0] ?? "");
        conditions.push(like(column, value));
        break;
      }
      case "in": {
        if (!condition.values || condition.values.length === 0) {
          continue;
        }
        conditions.push(inArray(column, condition.values));
        break;
      }
      case "notIn": {
        if (!condition.values || condition.values.length === 0) {
          continue;
        }
        conditions.push(notInArray(column, condition.values));
        break;
      }
      case "isNull": {
        conditions.push(isNull(column));
        break;
      }
      case "isNotNull": {
        conditions.push(isNotNull(column));
        break;
      }
      case "between": {
        if ((condition.values?.length ?? 0) < 2) {
          continue;
        }
        const [start, end] = condition.values as [any, any];
        conditions.push(between(column, start, end));
        break;
      }
      case "notBetween": {
        if ((condition.values?.length ?? 0) < 2) {
          continue;
        }
        const [start, end] = condition.values as [any, any];
        conditions.push(notBetween(column, start, end));
        break;
      }
      case "gt": {
        if (!condition.values || condition.values.length === 0) {
          continue;
        }
        conditions.push(gt(column, condition.values[0] as any));
        break;
      }
      case "gte": {
        if (!condition.values || condition.values.length === 0) {
          continue;
        }
        conditions.push(gte(column, condition.values[0] as any));
        break;
      }
      case "lt": {
        if (!condition.values || condition.values.length === 0) {
          continue;
        }
        conditions.push(lt(column, condition.values[0] as any));
        break;
      }
      case "lte": {
        if (!condition.values || condition.values.length === 0) {
          continue;
        }
        conditions.push(lte(column, condition.values[0] as any));
        break;
      }
      case "eq": {
        if (!condition.values || condition.values.length === 0) {
          continue;
        }
        conditions.push(eq(column, condition.values[0] as any));
        break;
      }
      case "neq": {
        if (!condition.values || condition.values.length === 0) {
          continue;
        }
        conditions.push(ne(column, condition.values[0] as any));
        break;
      }
      default: {
        break;
      }
    }
  }

  if (conditions.length === 0) {
    return undefined;
  }

  return conditions.length === 1 ? conditions[0] : and(...conditions);
}

export function buildDbOrders(schema: Record<string, any>, orders?: DbOrders){
  
  const orderExpressions = (orders?.orders ?? [])
  .map((order) => {
      const column = schema[order.field as keyof typeof schema];
      if (!column) {
          return undefined;
      }
      return order.direction === 'asc' ? asc(column) : desc(column);
  })
  .filter((expr): expr is ReturnType<typeof asc> => Boolean(expr));
  return (orderExpressions.length ? orderExpressions : [desc(schema.id)])
}
