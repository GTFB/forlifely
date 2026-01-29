"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Filter, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/packages/components/ui/slider";
import { fetchProducts, parseProduct } from "@/lib/api/products";
import { fetchCategoriesFromProducts, RESTAURANT_CATEGORIES } from "@/lib/api/categories";
import { formatPrice } from "@/lib/format-price";
import { getCategorySlug } from "@/lib/slug";
import type { ProductParsed } from "@/types/product";
import type { CategoryFromProducts } from "@/types/category";
import { Container } from "@/components/Container";
import { ProductCard } from "@/components/product/product-card";
import { useLocale } from "@/hooks/use-locale";
import { t } from "@/lib/i18n";

function ProductFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  minPrice,
  maxPrice,
  onPriceChange,
  priceRange,
  disableCategoryChange = false,
}: {
  categories: CategoryFromProducts[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  minPrice: string;
  maxPrice: string;
  onPriceChange: (min: string, max: string) => void;
  priceRange: { min: number; max: number };
  disableCategoryChange?: boolean;
}) {
  const { locale } = useLocale();
  // Convert slug to display name
  const getCategoryDisplayName = (slug: string): string => {
    const category = RESTAURANT_CATEGORIES.find(cat => cat.slug === slug);
    return category ? category.name : slug;
  };

  // Sort categories alphabetically
  const sortedCategories = [...categories].sort((a, b) => {
    const aName = getCategoryDisplayName(a.name);
    const bName = getCategoryDisplayName(b.name);
    return aName.localeCompare(bName);
  });
  return (
    <Card className="py-6">
      <CardContent className="px-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="size-5" />
            <h3 className="font-semibold">{t("catalog.filters", locale)}</h3>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("catalog.searchProducts", locale)}
              className={searchQuery ? "pl-10 pr-10" : "pl-10"}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                onClick={() => onSearchChange("")}
                aria-label={t("common.search", locale)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="mb-6">
          <Label className="mb-2 block text-sm font-medium">{t("catalog.price", locale)}</Label>
          
          {/* Range Slider */}
          {priceRange.max > priceRange.min && (
            <div className="mb-4 px-1">
              <Slider
                value={[
                  minPrice ? Math.max(priceRange.min, Math.min(parseFloat(minPrice), priceRange.max)) : priceRange.min,
                  maxPrice ? Math.max(priceRange.min, Math.min(parseFloat(maxPrice), priceRange.max)) : priceRange.max,
                ]}
                onValueChange={(values) => {
                  const [min, max] = values;
                  onPriceChange(
                    min === priceRange.min ? "" : min.toString(),
                    max === priceRange.max ? "" : max.toString()
                  );
                }}
                min={priceRange.min}
                max={priceRange.max}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{formatPrice(priceRange.min)}</span>
                <span>{formatPrice(priceRange.max)}</span>
              </div>
            </div>
          )}

          {/* Input fields */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Input
                type="number"
                placeholder={t("catalog.from", locale)}
                value={minPrice}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value ? parseFloat(value) : priceRange.min;
                  const clampedValue = Math.max(priceRange.min, Math.min(numValue, maxPrice ? parseFloat(maxPrice) : priceRange.max));
                  onPriceChange(value === "" ? "" : clampedValue.toString(), maxPrice);
                }}
                min={priceRange.min}
                max={maxPrice ? parseFloat(maxPrice) : priceRange.max}
                step="1"
              />
            </div>
            <div>
              <Input
                type="number"
                placeholder={t("catalog.to", locale)}
                value={maxPrice}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value ? parseFloat(value) : priceRange.max;
                  const clampedValue = Math.max(minPrice ? parseFloat(minPrice) : priceRange.min, Math.min(numValue, priceRange.max));
                  onPriceChange(minPrice, value === "" ? "" : clampedValue.toString());
                }}
                min={minPrice ? parseFloat(minPrice) : priceRange.min}
                max={priceRange.max}
                step="1"
              />
            </div>
          </div>
          {(minPrice || maxPrice) && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-7 w-full text-xs"
              onClick={() => onPriceChange("", "")}
            >
              {t("catalog.resetPrice", locale)}
            </Button>
          )}
        </div>


        <div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
            {!disableCategoryChange && (
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                className="w-full justify-start"
                onClick={() => onCategoryChange(null)}
              >
                {t("catalog.allCategories", locale)}
              </Button>
            )}
            {sortedCategories.map((category) => {
              const displayName = getCategoryDisplayName(category.name);
              return (
                <Button
                  key={category.name}
                  variant={selectedCategory === category.name ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => !disableCategoryChange && onCategoryChange(category.name)}
                  disabled={disableCategoryChange && selectedCategory !== category.name}
                >
                  <span className="truncate">{displayName}</span>
                  <Badge variant="secondary" className="ms-1 text-xs">
                    {category.count}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


function ProductGrid({
  products,
  loading,
  loadingMore,
  hasMore,
  loadMoreRef,
  selectedCategory,
  totalProducts,
  hideHeader = false,
  isCategoryPage = false,
}: {
  products: ProductParsed[];
  loading: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  loadMoreRef?: React.RefObject<HTMLDivElement | null>;
  selectedCategory?: string | null;
  totalProducts?: number;
  hideHeader?: boolean;
  isCategoryPage?: boolean;
}) {
  const { locale } = useLocale();
  
  // Convert slug to display name
  const getCategoryDisplayName = (category: string | null): string => {
    if (!category) return "";
    const cat = RESTAURANT_CATEGORIES.find(c => c.slug === category || c.name === category);
    return cat ? cat.name : category;
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">{t("catalog.loading", locale)}</div>
    );
  }

  if (products.length === 0) {
    const categoryDisplayName = selectedCategory ? getCategoryDisplayName(selectedCategory) : null;
    return (
      <div className="text-center py-12 text-muted-foreground">
        {categoryDisplayName ? `${t("catalog.noProducts", locale)} ${t("catalog.category", locale)} "${categoryDisplayName}"` : t("catalog.noProducts", locale)}
      </div>
    );
  }

  const getItemCountText = (count: number) => {
    if (count === 1) return t("catalog.item", locale);
    return t("catalog.items", locale);
  };

  // 4 columns for category pages, 3 columns for main catalog page
  const gridCols = isCategoryPage ? "lg:grid-cols-4" : "lg:grid-cols-3";
  const categoryDisplayName = selectedCategory ? getCategoryDisplayName(selectedCategory) : null;

  return (
    <div>
      {!hideHeader && (
        <Card className="mb-6">
          <CardContent className="p-6 -my-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">
                  {categoryDisplayName ? `${t("catalog.category", locale)}: ${categoryDisplayName}` : t("catalog.allProducts", locale)}
                </h2>
                <p className="text-muted-foreground text-sm mt-0.5">
                  {t("catalog.found", locale)} {totalProducts || products.length} {getItemCountText(totalProducts || products.length)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <div className={`grid gap-6 sm:grid-cols-2 ${gridCols}`}>
        {products.map((product) => {
          return <ProductCard key={product.id} product={product} />;
        })}
      </div>
      {loadingMore && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>{locale === 'es' ? 'Cargando más...' : locale === 'de' ? 'Mehr laden...' : locale === 'fr' ? 'Chargement...' : locale === 'ua' ? 'Загрузка...' : 'Loading more...'}</span>
          </div>
        </div>
      )}
      {hasMore && !loadingMore && !loading && (
        <div ref={loadMoreRef} className="h-20 w-full" />
      )}
    </div>
  );
}

export function ProductListingPage({ 
  categorySlug, 
  onProductsLoaded 
}: { 
  categorySlug?: string;
  onProductsLoaded?: (count: number) => void;
} = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<ProductParsed[]>([]);
  const [categories, setCategories] = useState<CategoryFromProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 24;
  
  // If categorySlug is provided, find the category name from RESTAURANT_CATEGORIES
  const getCategoryNameFromSlug = (slug: string | undefined): string | null => {
    if (!slug) return null;
    // Decode URL-encoded slug
    let decodedSlug = slug;
    try {
      decodedSlug = decodeURIComponent(slug);
    } catch {
      decodedSlug = slug;
    }
    // Try exact match first
    let category = RESTAURANT_CATEGORIES.find(cat => cat.slug === decodedSlug);
    
    // If not found, try normalized match (with/without dashes)
    if (!category) {
      const normalizedSlug = decodedSlug.replace(/-/g, '');
      category = RESTAURANT_CATEGORIES.find(
        cat => cat.slug.replace(/-/g, '') === normalizedSlug
      );
    }
    
    return category ? category.name : null;
  };
  
  const getSlugFromCategoryName = (categoryName: string | null): string | null => {
    if (!categoryName) return null;
    const category = RESTAURANT_CATEGORIES.find(cat => cat.name === categoryName);
    return category ? category.slug : null;
  };
  
  // Initialize selectedCategory based on categorySlug or URL params
  const getInitialCategory = () => {
    if (categorySlug) {
      const categoryName = getCategoryNameFromSlug(categorySlug);
      return categoryName;
    }
    return searchParams.get("category");
  };
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => getInitialCategory());
  
  // Display states (immediate updates for UI)
  const [searchQueryDisplay, setSearchQueryDisplay] = useState(
    searchParams.get("search") || ""
  );
  const [minPriceDisplay, setMinPriceDisplay] = useState(searchParams.get("minPrice") || "");
  const [maxPriceDisplay, setMaxPriceDisplay] = useState(searchParams.get("maxPrice") || "");
  
  // Debounced states (for actual filtering)
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");

  useEffect(() => {
    // Update selected category when categorySlug changes
    if (categorySlug) {
      const categoryName = getCategoryNameFromSlug(categorySlug);
      if (categoryName) {
        setSelectedCategory(categoryName);
      } else {
        // If category not found, set to null to show all products
        setSelectedCategory(null);
      }
    } else if (!searchParams.get("category")) {
      // If no categorySlug and no category in URL, reset to null
      setSelectedCategory(null);
    }
  }, [categorySlug, searchParams]);

  const handleCategoryChange = (category: string | null) => {
    if (categorySlug) {
      // If we're on a category page, navigate to the new category page
      const newSlug = getSlugFromCategoryName(category);
      if (newSlug) {
        router.push(`/catalog/${newSlug}`);
      } else if (category === null) {
        router.push("/catalog");
      }
    } else {
      // If we're on the main catalog page, just update the filter
      setSelectedCategory(category);
    }
  };

  // Debounce search query (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchQueryDisplay);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQueryDisplay]);

  // Debounce price filters (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinPrice(minPriceDisplay);
      setMaxPrice(maxPriceDisplay);
    }, 300);

    return () => clearTimeout(timer);
  }, [minPriceDisplay, maxPriceDisplay]);

  // Get category for API
  const getCategoryForApi = useCallback(() => {
    if (categorySlug) {
      return categorySlug;
    } else if (selectedCategory) {
      const isSlug = /^[a-z0-9-]+$/.test(selectedCategory);
      if (isSlug) {
        return selectedCategory;
      } else {
        const category = RESTAURANT_CATEGORIES.find(cat => cat.name === selectedCategory);
        return category ? category.slug : selectedCategory;
      }
    }
    return undefined;
  }, [categorySlug, selectedCategory]);

  // Load products with pagination
  const loadProducts = useCallback(async (page: number, reset: boolean = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const categoryForApi = getCategoryForApi();
      
      const productsResponse = await fetchProducts({
        category: categoryForApi,
        search: searchQuery || undefined,
        page: page,
        pageSize: ITEMS_PER_PAGE,
      });

      if (productsResponse.success) {
        let parsedProducts = productsResponse.data.map(parseProduct);
        
        // Filter by price on client side
        if (minPrice || maxPrice) {
          parsedProducts = parsedProducts.filter((product) => {
            const price = parseFloat(product.dataIn?.price || product.paid || "0");
            const min = minPrice ? parseFloat(minPrice) : 0;
            const max = maxPrice ? parseFloat(maxPrice) : Infinity;
            return price >= min && price <= max;
          });
        }

        setTotalProducts(productsResponse.pagination.total);
        
        // Update products and calculate hasMore
        setProducts(prev => {
          const newProducts = reset ? parsedProducts : [...prev, ...parsedProducts];
          const hasMoreProducts = parsedProducts.length === ITEMS_PER_PAGE && 
                                  newProducts.length < productsResponse.pagination.total;
          setHasMore(hasMoreProducts);
          
          // Debug logging
          if (process.env.NODE_ENV === 'development') {
            console.log('📦 Products loaded:', {
              page,
              reset,
              loaded: parsedProducts.length,
              currentTotal: newProducts.length,
              apiTotal: productsResponse.pagination.total,
              hasMore: hasMoreProducts,
            });
          }
          
          return newProducts;
        });
        
        if (reset) {
          setCurrentPage(1);
        }

        if (onProductsLoaded && reset) {
          onProductsLoaded(productsResponse.pagination.total);
        }

        // Calculate price range from first page only
        if (reset && parsedProducts.length > 0) {
          const prices = parsedProducts
            .map((p) => parseFloat(p.dataIn?.price || p.paid || "0"))
            .filter((p) => !isNaN(p) && p > 0);
          
          if (prices.length > 0) {
            const min = Math.floor(Math.min(...prices));
            const max = Math.ceil(Math.max(...prices));
            setPriceRange({ min, max });
          }
        }
      }
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, searchQuery, minPrice, maxPrice, categorySlug, getCategoryForApi, onProductsLoaded]);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await fetchCategoriesFromProducts();
        setCategories(categoriesData);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };
    loadCategories();
  }, []);

  // Load initial products when filters change
  useEffect(() => {
    setCurrentPage(1);
    setProducts([]);
    loadProducts(1, true);
  }, [selectedCategory, searchQuery, minPrice, maxPrice, loadProducts]);

  // Load more products when scrolling
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      const nextPage = currentPage + 1;
      console.log('🔄 Loading more products, page:', nextPage);
      setCurrentPage(nextPage);
      loadProducts(nextPage, false);
    } else {
      console.log('⏸️ Cannot load more:', { loadingMore, hasMore, loading });
    }
  }, [currentPage, hasMore, loadingMore, loading, loadProducts]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!hasMore || loadingMore || loading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
          console.log('👁️ Intersection Observer triggered');
          loadMore();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px' // Start loading 100px before the element is visible
      }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      console.log('👀 Observing element for infinite scroll');
      observer.observe(currentRef);
    } else {
      console.warn('⚠️ loadMoreRef is not set');
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, loadingMore, loading, loadMore]);

  // If categorySlug is provided, hide filters and show full width grid
  if (categorySlug) {
    return (
      <ProductGrid 
        products={products} 
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        loadMoreRef={loadMoreRef}
        selectedCategory={selectedCategory}
        totalProducts={totalProducts}
        hideHeader={true}
        isCategoryPage={true}
      />
    );
  }

  const content = (
    <div className="grid gap-8 lg:grid-cols-4">
      <div className="lg:col-span-1">
        <div className="sticky top-20">
          <ProductFilters
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            searchQuery={searchQueryDisplay}
            onSearchChange={setSearchQueryDisplay}
            minPrice={minPriceDisplay}
            maxPrice={maxPriceDisplay}
            onPriceChange={(min, max) => {
              setMinPriceDisplay(min);
              setMaxPriceDisplay(max);
            }}
            priceRange={priceRange}
            disableCategoryChange={!!categorySlug}
          />
        </div>
      </div>
      <div className="lg:col-span-3">
        <ProductGrid 
          products={products} 
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          loadMoreRef={loadMoreRef}
          selectedCategory={selectedCategory}
          totalProducts={totalProducts}
        />
      </div>
    </div>
  );

  return (
    <section className="py-8">
      <Container>
        {content}
      </Container>
    </section>
  );
}
