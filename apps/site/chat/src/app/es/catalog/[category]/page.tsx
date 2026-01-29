import { CategoryPageClient } from "./page-client";
import { RESTAURANT_CATEGORIES } from "@/lib/api/categories";

export const dynamicParams = false;
export const dynamic = 'error';

export async function generateStaticParams(): Promise<Array<{ category: string }>> {
  return RESTAURANT_CATEGORIES.map((cat) => ({
    category: cat.slug,
  }));
}

export default function CategoryPage() {
  return <CategoryPageClient />;
}
