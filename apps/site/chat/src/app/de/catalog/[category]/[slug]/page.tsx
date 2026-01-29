import { ProductPageClient } from "./page-client";
import { RESTAURANT_CATEGORIES } from "@/lib/api/categories";
import { getProductSlug, getCategorySlug } from "@/lib/slug";

export const dynamicParams = true;
export const dynamic = 'force-dynamic';

async function fetchAllProductsForBuild(): Promise<Array<{ category: string; slug: string }>> {
  try {
    // Try to fetch from production API during build
    // Use production URL for Cloudflare Pages
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
                   process.env.API_URL || 
                   'https://gastrobar.pages.dev';
    
    const response = await fetch(`${apiUrl}/api/products?pageSize=1000`, {
      // Add cache to avoid rate limiting during build
      cache: 'force-cache'
    });

    if (!response.ok) {
      console.warn(`Failed to fetch products for static generation (${response.status}), using placeholders`);
      return RESTAURANT_CATEGORIES.map((cat) => ({
        category: cat.slug,
        slug: 'placeholder',
      }));
    }

    const data = await response.json() as { success?: boolean; data?: Array<any> };
    
    if (!data.success || !data.data || !Array.isArray(data.data)) {
      console.warn('Invalid products response, using placeholders');
      return RESTAURANT_CATEGORIES.map((cat) => ({
        category: cat.slug,
        slug: 'placeholder',
      }));
    }

    // Generate params for all products
    const params: Array<{ category: string; slug: string }> = [];
    
    for (const product of data.data) {
      const productData = product as { title?: any; uuid?: string; category?: string | null };
      const productSlug = getProductSlug({ title: productData.title, uuid: productData.uuid || '' });
      const categorySlug = getCategorySlug(productData.category);
      
      if (productSlug && categorySlug && categorySlug !== 'all') {
        params.push({
          category: categorySlug,
          slug: productSlug,
        });
      }
    }

    // If no products found, return placeholders
    if (params.length === 0) {
      console.warn('No products found, using placeholders');
      return RESTAURANT_CATEGORIES.map((cat) => ({
        category: cat.slug,
        slug: 'placeholder',
      }));
    }

    console.log(`Generated ${params.length} product static params`);
    return params;
  } catch (error) {
    console.warn('Error fetching products for static generation:', error);
    // Return placeholders on error
    return RESTAURANT_CATEGORIES.map((cat) => ({
      category: cat.slug,
      slug: 'placeholder',
    }));
  }
}

export async function generateStaticParams(): Promise<Array<{ category: string; slug: string }>> {
  return await fetchAllProductsForBuild();
}

export default function ProductPage() {
  return <ProductPageClient />;
}
