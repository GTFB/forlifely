import type { ProductParsed } from "./product";
import type { ProductVariantParsed } from "./product-variant";

export interface CartItem {
  id: string;
  productUuid: string;
  paid?: string; // Product AID (paid)
  variantUuid?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string | null;
  attributes?: Record<string, any>;
}

export interface Promocode {
  code: string;
  title: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  discount: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
  promocode?: Promocode | null;
}

