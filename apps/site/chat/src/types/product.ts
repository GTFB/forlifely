export type ProductTitle = string | Record<string, any> | null;

export interface ProductDetails {
  collection?: { ru: string; en: string };
  silhouette?: { ru: string; en: string };
  textile?: { ru: string; en: string };
  finishing?: { ru: string; en: string };
  recommendedActivities?: { ru: string; en: string };
  sizesInStock?: string;
}

export interface ProductDataIn extends Record<string, any> {
  price?: string;
  image?: string; // Deprecated: use images array instead
  images?: string[]; // Gallery of images (5 images: 01-05)
  size?: string; // Size information, e.g. "S", "M", "L"
  weight?: string; // Deprecated: use size instead. Граммовка, например "250 г", "500 г"
  description?: string; // Подробное описание товара
  excerpt?: string; // Краткое описание товара
  details?: ProductDetails; // Detailed product information
  topSales?: boolean;
  attributes?: {
    country?: string | { ru?: string; en?: string };
    length?: string | { ru?: string; en?: string };
    weight?: string | { ru?: string; en?: string };
    vbn?: string | { ru?: string; en?: string };
  };
}

export interface Product {
  id: number;
  uuid: string;
  paid: string;
  title: ProductTitle;
  category: string | null;
  type: string | null;
  status_name: string | null;
  is_public: number | null;
  order: number | null;
  xaid: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: number | null;
  gin: string | null;
  fts: string | null;
  data_in: string | null;
  dataIn: string | null;
  data_out: string | null;
}

export interface ProductParsed {
  id: number;
  uuid: string;
  paid: string;
  title: string;
  titleRaw: ProductTitle;
  category: string | null;
  categories?: string[]; // Array of all categories (for products with multiple categories)
  type: string | null;
  status_name: string | null;
  is_public: number | null;
  order: number | null;
  xaid: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: number | null;
  gin: Record<string, any> | null;
  fts: string | null;
  dataIn: ProductDataIn | null;
  data_out: Record<string, any> | null;
  slug: string;
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

