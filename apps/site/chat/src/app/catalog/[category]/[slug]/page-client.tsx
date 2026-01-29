"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MainLayout } from "@/components/layouts/main-layout";
import { ProductOverview } from "@/components/product/product";
import { fetchProductBySlug, parseProduct, fetchProducts } from "@/lib/api/products";
import type { ProductParsed } from "@/types/product";
import { Container } from "@/components/Container";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { RESTAURANT_CATEGORIES } from "@/lib/api/categories";

export function ProductPageClient() {
  const params = useParams();
  const category = params.category as string;
  const slug = params.slug as string;
  const [product, setProduct] = useState<ProductParsed | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<ProductParsed[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        // Decode slug and category from URL (Next.js params are already decoded, but ensure it)
        const decodedSlug = slug ? decodeURIComponent(slug) : slug;
        // Category slug is already transliterated, so we need to find the original category name
        // by matching it with products' categories
        console.log("Loading product with slug:", decodedSlug, "category:", category);
        const productData = await fetchProductBySlug(decodedSlug, category);
        console.log("Product found:", productData);
        setProduct(productData);
      } catch (error) {
        console.error("Failed to load product:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadProduct();
    }
  }, [slug, category]);

  useEffect(() => {
    if (!product) return;

    const loadRelatedProducts = async () => {
      try {
        setLoadingRelated(true);
        // Load products from the same category or popular products
        const response = await fetchProducts({ 
          pageSize: 4,
          category: product.category || undefined,
        });
        if (response.success) {
          const parsedProducts = response.data.map(parseProduct);
          // Exclude current product and take first 4
          const filtered = parsedProducts
            .filter(item => item.uuid !== product.uuid && item.id !== product.id)
            .slice(0, 4);
          setRelatedProducts(filtered);
        }
      } catch (error) {
        console.error('Failed to load related products:', error);
      } finally {
        setLoadingRelated(false);
      }
    };

    loadRelatedProducts();
  }, [product]);

  if (loading) {
    return (
      <MainLayout>
        <Container className="py-12 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </Container>
      </MainLayout>
    );
  }

  // Get category name from slug
  const getCategoryName = (slug: string | undefined): string => {
    if (!slug) return "Category";
    let decodedSlug = slug;
    try {
      decodedSlug = decodeURIComponent(slug);
    } catch {
      decodedSlug = slug;
    }
    const category = RESTAURANT_CATEGORIES.find(
      (cat) => cat.slug === decodedSlug
    );
    if (!category) {
      const normalizedSlug = decodedSlug.replace(/-/g, '');
      const found = RESTAURANT_CATEGORIES.find(
        (cat) => cat.slug.replace(/-/g, '') === normalizedSlug
      );
      return found ? found.name : decodedSlug;
    }
    return category.name;
  };

  const categoryName = getCategoryName(category);
  const categorySlug = category || '';

  if (!product) {
    return (
      <MainLayout>
        <Container className="py-12 text-center">
          <p className="text-muted-foreground">Product not found</p>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="py-12 lg:py-16">
        <Container>
          <div className="space-y-8">
            <div className="flex justify-between items-center mb-8">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/catalog">Catalog</BreadcrumbLink>
                </BreadcrumbItem>
                {categorySlug && (
                  <>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href={`/catalog/${categorySlug}`}>{categoryName}</BreadcrumbLink>
                    </BreadcrumbItem>
                  </>
                )}
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="max-w-[150px] md:max-w-none truncate md:truncate-none">{typeof product.title === 'object' && product.title !== null ? (product.title as any).en || (product.title as any).ru : (product.title || 'Product')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Link href={categorySlug ? `/catalog/${categorySlug}` : '/catalog'}>
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {categorySlug ? `Back to ${categoryName}` : 'Back to Catalog'}
              </Button>
            </Link>
          </div>
        </div>
        <ProductOverview product={product} />
        
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-16 border-t">
            <h2 className="mb-8 text-2xl font-bold text-center sm:text-3xl">
              Frequently Bought Together
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
        </Container>
      </div>
    </MainLayout>
  );
}

