"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/Container";
import { MainLayout } from "@/components/layouts/main-layout";
import { getFavoritesWithDetails, removeFromFavorites } from "@/lib/favorites";
import { fetchProducts, parseProduct } from "@/lib/api/products";
import { ProductCard } from "@/components/product/product-card";
import type { ProductParsed } from "@/types/product";

export default function FavoritesPage() {
  const [favoriteProducts, setFavoriteProducts] = useState<ProductParsed[]>([]);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<ProductParsed[]>([]);
  const previousUuidsRef = useRef<string>("");

  useEffect(() => {
    let isMounted = true;

    const loadFavorites = async () => {
      try {
        const favorites = getFavoritesWithDetails();
        const currentUuids = new Set(favorites.map((f) => f.productUuid));
        const currentUuidsString = Array.from(currentUuids).sort().join(",");
        
        // Check if favorites actually changed
        if (currentUuidsString === previousUuidsRef.current) {
          return; // No changes, skip reload
        }

        previousUuidsRef.current = currentUuidsString;
        
        if (favorites.length === 0) {
          if (isMounted) {
            setFavoriteProducts([]);
            setRelatedProducts([]);
            setLoading(false);
          }
          return;
        }

        // Load all products first
        const response = await fetchProducts({ pageSize: 1000 });
        if (!response.success) {
          if (isMounted) {
            setFavoriteProducts([]);
            setRelatedProducts([]);
            setLoading(false);
          }
          return;
        }

        // Filter products that are in favorites
        const parsedProducts = response.data.map(parseProduct);
        const favoritesList = parsedProducts.filter((product) =>
          currentUuids.has(product.uuid)
        );

        // Sort by addedAt date (most recent first)
        favoritesList.sort((a, b) => {
          const aDate = favorites.find((f) => f.productUuid === a.uuid)?.addedAt || "";
          const bDate = favorites.find((f) => f.productUuid === b.uuid)?.addedAt || "";
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        });

        if (isMounted) {
          setFavoriteProducts(favoritesList);

          // Load related products (not in favorites)
          const related = parsedProducts
            .filter((product) => !currentUuids.has(product.uuid))
            .slice(0, 4);
          setRelatedProducts(related);
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to load favorites:", error);
        if (isMounted) {
          setFavoriteProducts([]);
          setRelatedProducts([]);
          setLoading(false);
        }
      }
    };

    loadFavorites();

    // Listen for storage changes (only from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "craft-house-favorites") {
        previousUuidsRef.current = ""; // Force reload
        loadFavorites();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    
    // Check for changes less frequently (every 3 seconds)
    const interval = setInterval(() => {
      loadFavorites();
    }, 3000);

    return () => {
      isMounted = false;
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleRemoveFromFavorites = (productUuid: string) => {
    removeFromFavorites(productUuid);
    previousUuidsRef.current = ""; // Force reload
    setFavoriteProducts((prev) => prev.filter((p) => p.uuid !== productUuid));
  };

  if (loading) {
    return (
      <MainLayout>
        <section className="py-8">
          <Container>
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </Container>
        </section>
      </MainLayout>
    );
  }

  if (favoriteProducts.length === 0) {
    return (
      <MainLayout>
        <section className="py-8">
          <Container>
            <div className="mb-8">
              <Link href="/">
                <Button variant="ghost" className="mb-4">
                  <ArrowLeft className="mr-2 size-4" />
                  Back to Shopping
                </Button>
              </Link>
              <h1 className="text-3xl font-bold tracking-tight text-balance">Favorites</h1>
              <p className="text-muted-foreground mt-2">Favorites list is empty</p>
            </div>
            <Card className="py-12">
              <CardContent className="text-center">
                <Heart className="size-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">You don't have any favorite products yet</p>
                <Link href="/catalog">
                  <Button>Go to Catalog</Button>
                </Link>
              </CardContent>
            </Card>
          </Container>
        </section>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section className="py-8">
        <Container>
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 size-4" />
                Back to Shopping
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-balance">Favorites</h1>
            <p className="text-muted-foreground mt-2">
              {favoriteProducts.length}{" "}
              {favoriteProducts.length === 1
                ? "item"
                : "items"}{" "}
              in favorites
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {favoriteProducts.map((product) => (
              <ProductCard
                key={product.uuid}
                product={product}
                onCartUpdate={() => {}}
                showRemoveButton={true}
                onRemoveFromFavorites={() => handleRemoveFromFavorites(product.uuid)}
              />
            ))}
          </div>

          {relatedProducts.length > 0 && (
            <div className="mt-12">
              <h3 className="mb-4 text-lg font-semibold">You may also like</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {relatedProducts.map((product) => (
                  <ProductCard
                    key={product.uuid}
                    product={product}
                    onCartUpdate={() => {}}
                  />
                ))}
              </div>
            </div>
          )}
        </Container>
      </section>
    </MainLayout>
  );
}

