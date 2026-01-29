"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MainLayout } from "@/components/layouts/main-layout";
import { ProductListingPage } from "@/components/catalog/list";
import { Container } from "@/components/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { RESTAURANT_CATEGORIES } from "@/lib/api/categories";

const CATEGORY_DESCRIPTIONS: Record<string, { title: string; description: string }> = {
  "marketing": {
    title: "Marketing",
    description: "Professional marketing services including strategic consulting, business analysis, and growth planning.",
  },
  "goods": {
    title: "Goods",
    description: "Quality products and goods for your business and personal needs.",
  },
  "flowers": {
    title: "Flowers",
    description: "Fresh flowers and floral arrangements for any occasion.",
  },
};

// Helper function to get category info from slug
function getCategoryInfo(slug: string | undefined): { name: string; title: string; description: string } | null {
  if (!slug) return null;
  
  // Decode URL-encoded slug
  let decodedSlug = slug;
  try {
    decodedSlug = decodeURIComponent(slug);
  } catch {
    decodedSlug = slug;
  }
  
  // Find category by slug (try exact match first, then try normalized versions)
  let category = RESTAURANT_CATEGORIES.find(
    (cat) => cat.slug === decodedSlug
  );

  // If not found, try to find by normalized slug (with/without dashes)
  if (!category) {
    const normalizedSlug = decodedSlug.replace(/-/g, '');
    category = RESTAURANT_CATEGORIES.find(
      (cat) => cat.slug.replace(/-/g, '') === normalizedSlug
    );
  }

  if (category) {
    // Try to get description by exact slug, then by normalized slug
    const description = CATEGORY_DESCRIPTIONS[decodedSlug] || 
                       CATEGORY_DESCRIPTIONS[category.slug] ||
                       CATEGORY_DESCRIPTIONS[decodedSlug.replace(/-/g, '')] ||
                       CATEGORY_DESCRIPTIONS[category.slug.replace(/-/g, '')];
    
    return {
      name: category.name,
      title: description?.title || category.name,
      description: description?.description || "",
    };
  } else {
    // If category not found, still show something
    return {
      name: decodedSlug,
      title: decodedSlug,
      description: "",
    };
  }
}

export function CategoryPageClient() {
  const params = useParams();
  const categorySlug = params.category as string;
  const [categoryInfo, setCategoryInfo] = useState<{ name: string; title: string; description: string } | null>(null);
  const [productCount, setProductCount] = useState<number | null>(null);

  // Initialize category info immediately
  const initialCategoryInfo = categorySlug ? getCategoryInfo(categorySlug) : null;
  const [displayCategoryInfo, setDisplayCategoryInfo] = useState<{ name: string; title: string; description: string } | null>(initialCategoryInfo);

  useEffect(() => {
    if (categorySlug) {
      const info = getCategoryInfo(categorySlug);
      if (info) {
        setDisplayCategoryInfo(info);
        setCategoryInfo(info);
      }
    }
  }, [categorySlug]);

  // Show loading state or category info
  const displayTitle = displayCategoryInfo?.title || categorySlug || "Category";
  const displayDescription = displayCategoryInfo?.description || "";

  return (
    <MainLayout>
      <section className="py-12 lg:py-16">
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
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="max-w-[150px] md:max-w-none truncate md:truncate-none">{displayTitle}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <Link href="/catalog">
                <Button variant="ghost">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Catalog
                </Button>
              </Link>
            </div>
          </div>
          <Card className="mb-8">
            <CardContent className="p-6">
              <h1 className="text-3xl font-bold mb-4">
                {displayTitle}
                {productCount !== null && ` (${productCount})`}
              </h1>
              {displayDescription && (
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {displayDescription}
                </p>
              )}
            </CardContent>
          </Card>
          <Suspense fallback={<div className="text-center py-8 text-muted-foreground">Loading...</div>}>
            <ProductListingPage 
              categorySlug={categorySlug} 
              onProductsLoaded={(count) => setProductCount(count)}
            />
          </Suspense>
        </Container>
      </section>
    </MainLayout>
  );
}

