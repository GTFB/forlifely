"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Minus, ShoppingCart, Star, X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format-price";
import { getProductSlug, getCategorySlug } from "@/lib/slug";
import { addToCart } from "@/lib/cart";
import { toggleFavorite, isInFavorites } from "@/lib/favorites";
import { RESTAURANT_CATEGORIES } from "@/lib/api/categories";
import type { ProductParsed } from "@/types/product";
import { useLocale } from "@/hooks/use-locale";
import { t } from "@/lib/i18n";

interface ProductCardProps {
  product: ProductParsed;
  onCartUpdate?: () => void;
  onRemoveFromFavorites?: () => void;
  showRemoveButton?: boolean;
}

const RatingStars = ({ rating, className }: { rating: number; className?: string }) => (
  <div className={cn("flex items-center gap-0.5", className)}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={cn(
          "size-4",
          i < rating
            ? "fill-yellow-400 text-yellow-400"
            : "fill-muted text-muted"
        )}
      />
    ))}
  </div>
);

export function ProductCard({ product, onCartUpdate, onRemoveFromFavorites, showRemoveButton }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const { locale, getLocalizedPath } = useLocale();
  const slug = getProductSlug({ title: product.titleRaw, uuid: product.uuid });
  const categorySlug = getCategorySlug(product.category);
  
  useEffect(() => {
    setIsFavorite(isInFavorites(product.uuid));
  }, [product.uuid]);
  
  // Convert category slug to display name
  const getCategoryDisplayName = (category: string | null | undefined): string => {
    if (!category) return "";
    const cat = RESTAURANT_CATEGORIES.find(c => c.slug === category || c.name === category);
    return cat ? cat.name : category;
  };
  
  const categoryDisplayName = getCategoryDisplayName(product.category);
  
  // Get image path from dataIn - support both old 'image' and new 'images' format
  let imageSrc: string | null = null;
  let hasImage = false;
  
  // Try new format first (images array)
  if (product.dataIn?.images && Array.isArray(product.dataIn.images) && product.dataIn.images.length > 0) {
    let imagePath = product.dataIn.images[0];
    // Handle paths with images/ prefix or full paths
    if (imagePath.startsWith('/images/')) {
      imageSrc = imagePath;
      hasImage = true;
    } else if (imagePath.startsWith('images/')) {
      imageSrc = `/${imagePath}`;
      hasImage = true;
    } else if (!imagePath.startsWith('http')) {
      // Add images/ prefix if not present
      imagePath = `images/${imagePath}`;
      imageSrc = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
      hasImage = true;
    } else {
      imageSrc = imagePath;
      hasImage = true;
    }
  } 
  // Fallback to old format (single image)
  else if (product.dataIn?.image) {
    let imagePath = product.dataIn.image;
    // Add images/ prefix if not present and path doesn't start with http
    if (!imagePath.startsWith('http') && !imagePath.startsWith('images/') && !imagePath.startsWith('/images/')) {
      imagePath = `images/${imagePath}`;
    }
    // Ensure path starts with / and normalize slashes
    imageSrc = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    // Replace double slashes
    imageSrc = imageSrc.replace(/\/+/g, '/');
    hasImage = true;
  }
  
  // Debug: log image paths in development
  if (process.env.NODE_ENV === 'development' && product.dataIn?.image && !imageSrc) {
    console.warn('Product image not found:', {
      productTitle: product.title,
      dataInImage: product.dataIn.image,
      dataInImages: product.dataIn.images,
      imageSrc,
      hasImage
    });
  }
  
  const price = product.dataIn?.price || product.paid || "0";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, undefined, quantity);
    setQuantity(1); // Reset quantity after adding
    if (onCartUpdate) {
      onCartUpdate();
    }
  };

  const handleQuantityChange = (e: React.MouseEvent, delta: number) => {
    e.preventDefault();
    e.stopPropagation();
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newFavoriteState = toggleFavorite(product);
    setIsFavorite(newFavoriteState);
    if (!newFavoriteState && onRemoveFromFavorites) {
      onRemoveFromFavorites();
    }
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg group flex flex-col h-full py-0 relative">
      {showRemoveButton && onRemoveFromFavorites && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemoveFromFavorites();
          }}
          aria-label={t("common.removeFromFavorites", locale)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      <Link href={getLocalizedPath(`/catalog/${categorySlug}/${slug}`)} className="flex-1 flex flex-col">
        <CardContent className="p-0 flex-1 flex flex-col">
          <div className="aspect-square overflow-hidden relative bg-muted flex items-center justify-center">
            {hasImage && imageSrc ? (
              <img
                alt={product.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                src={imageSrc}
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  console.error('Failed to load image:', imageSrc, 'for product:', product.title);
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <ShoppingCart className="size-16 text-muted-foreground" />
            )}
          </div>
          <div className="px-4 pt-4 flex-1 flex flex-col">
            <div className="text-center">
              <CardTitle className="text-lg font-semibold line-clamp-1">
                {product.title}
              </CardTitle>
              {categoryDisplayName && (
                <p className="text-sm text-muted-foreground mt-1">{categoryDisplayName}</p>
              )}
            </div>
            <div className="flex items-center justify-between w-full gap-4 pt-2 mt-auto">
              <div className="flex items-center gap-2">
                <RatingStars rating={5} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0 hover:bg-transparent"
                  onClick={handleToggleFavorite}
                  aria-label={isFavorite ? t("common.removeFromFavorites", locale) : t("common.addToFavorites", locale)}
                >
                  <Heart
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isFavorite
                        ? "fill-red-500 text-red-500"
                        : "text-muted-foreground hover:text-red-500"
                    )}
                  />
                </Button>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-bold text-primary">
                  {formatPrice(price)}
                </p>
                {product.dataIn?.weight && (
                  <p className="text-sm text-muted-foreground">/ {product.dataIn.weight}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Link>
      <div className="px-4 pb-4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => handleQuantityChange(e, -1)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => handleQuantityChange(e, 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={handleAddToCart}
            className="flex-1"
            size="sm"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {t("products.addToCart", locale)}
          </Button>
        </div>
      </div>
    </Card>
  );
}

