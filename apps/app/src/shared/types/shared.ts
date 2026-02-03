export type DbFilterOperator = "exclude" | "like" | "in" | "notIn" | "isNull" | "isNotNull" | "between" | "notBetween" | "gt" | "gte" | "lt" | "lte" | "eq" | "neq";

export interface DbFilterCondition {
    field: string;
    operator: DbFilterOperator;
    values: Array<string | number | boolean | null>;
}

export interface DbFilters {
    conditions?: DbFilterCondition[];
}

export interface DbOrder {
    field: string;
    direction: 'asc' | 'desc';
}

export interface DbOrders {
    orders?: DbOrder[];
}

export interface DbPagination {
    page?: number;
    limit?: number;
}

export interface DbPaginationResult {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface DbPaginatedResult<T> {
    docs: T[];
    pagination: DbPaginationResult;
}
export interface MeUser {
    id: string
    uuid: string
    email: string
    name: string
    phone?: string
    humanAid?: string | null
    roles: Array<{
      uuid: string
      title: string
      name: string
      description: string | null
      isSystem: boolean
      dataIn: any
    }>
  }

export interface ChatRequest {
  message: string;
  context?: {
    scene_gaid?: string;
    text_content?: string;
  };
}

export interface ChatResponse {
  response: string;
}