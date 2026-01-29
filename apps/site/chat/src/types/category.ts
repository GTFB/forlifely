export interface Category {
  id: number;
  entity: string;
  name: string;
  title: string | null;
  sort_order: number;
  created_at: number | null;
  updated_at: number | null;
  deleted_at: number | null;
}

export interface CategoryFromProducts {
  name: string;
  count: number;
}

