export type ProductVariantTitle = string | Record<string, any> | null;

export type ProductVariantDataIn = Record<string, any> | null;

export interface ProductVariant {
  id: number;
  uuid: string;
  pvaid: string;
  full_paid: string;
  vendor_aid: string | null;
  sku: string | null;
  title: ProductVariantTitle;
  status_name: string | null;
  order: number | null;
  xaid: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: number | null;
  gin: string | null;
  fts: string | null;
  dataIn: ProductVariantDataIn | null;
  data_out: string | null;
}

export interface ProductVariantParsed {
  id: number;
  uuid: string;
  pvaid: string;
  full_paid: string;
  vendor_aid: string | null;
  sku: string | null;
  title: string;
  titleRaw: ProductVariantTitle;
  status_name: string | null;
  order: number | null;
  xaid: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: number | null;
  gin: Record<string, any> | null;
  fts: string | null;
  dataIn: ProductVariantDataIn;
  data_out: Record<string, any> | null;
}

