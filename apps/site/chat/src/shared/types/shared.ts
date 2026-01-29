
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
    roles: Array<{
      uuid: string
      raid: string
      title: string
      name: string
      description: string | null
      isSystem: boolean
      dataIn: any
    }>
  }

// Workshop API Types
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

export interface AssetResponse {
  aaid: string;
  title: string;
  type_name: string;
  gin?: any;
  xaid?: string;
  status_name?: string;
  order?: number;
}

export interface AssetsResponse {
  assets: AssetResponse[];
}

export interface CreateAssetRequest {
  title: string;
  type_name: string;
  xaid: string;
  gin?: any;
}

export interface UpdateAssetRequest {
  title?: string;
  gin?: any;
  xaid?: string;
}

export interface GoalNode {
  gaid: string;
  fullGaid?: string;
  parentFullGaid?: string;
  title: string;
  type: "book" | "volume" | "chapter" | "scene" | string;
  statusName?: string;
  order?: number;
  children?: GoalNode[];
}

export interface GoalsResponse {
  goals: GoalNode[];
}

export interface CreateGoalRequest {
  title: string;
  type: string;
  parent_full_gaid?: string;
}

export interface UpdateGoalRequest {
  title?: string;
  parent_full_gaid?: string;
  status_name?: string;
}

export interface TextResponse {
  taid: string;
  title?: string;
  content?: string;
  type?: string;
  status_name?: string;
  xaid?: string;
  gin?: any;
}

export interface TextResponseWrapper {
  text: TextResponse | null;
}

export interface CreateTextRequest {
  content?: string;
  title?: string;
  goal_gaid: string;
  gin?: any;
}

export interface UpdateTextRequest {
  content?: string;
  title?: string;
  gin?: any;
}