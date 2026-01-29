"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { Heart, Minus, Plus, Star, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/Container";
import type { ProductParsed } from "@/types/product";
import { formatPrice } from "@/lib/format-price";
import { toggleFavorite, isInFavorites } from "@/lib/favorites";
import { addToCart } from "@/lib/cart";
import { RESTAURANT_CATEGORIES } from "@/lib/api/categories";
import { useLocale } from "@/hooks/use-locale";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const RatingStars = ({ rating, className }: { rating: number; className?: string }) => (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn("size-5", i < rating ? "text-primary fill-primary" : "text-muted-foreground/30")}
        />
      ))}
    </div>
);

export function ProductOverview({ product }: { product: ProductParsed }) {
  const params = useParams();
  const categorySlug = params.category as string;
  const { locale } = useLocale();
  const currentLocale = locale || 'en';

  // Get image path from data_in - support both old 'image' and new 'images' format
  let images: string[] = [];
  let hasImage = false;
  
  // Try new format first (images array)
  if (product.dataIn?.images && Array.isArray(product.dataIn.images) && product.dataIn.images.length > 0) {
    images = product.dataIn.images.map((img: string) => {
      let imagePath = img;
      // Handle paths with images/ prefix or full paths
      if (imagePath.startsWith('/images/')) {
        hasImage = true;
        return imagePath;
      } else if (imagePath.startsWith('images/')) {
        hasImage = true;
        return `/${imagePath}`;
      } else if (!imagePath.startsWith('http')) {
        // Add images/ prefix if not present
        imagePath = `images/${imagePath}`;
        hasImage = true;
        return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
      }
      hasImage = true;
      return imagePath;
    });
  } 
  // Fallback to old format (single image)
  else if (product.dataIn?.image) {
    let imagePath = product.dataIn.image;
    // Add images/ prefix if not present and path doesn't start with http
    if (!imagePath.startsWith('http') && !imagePath.startsWith('images/') && !imagePath.startsWith('/images/')) {
      imagePath = `images/${imagePath}`;
    }
    // Ensure path starts with / and normalize slashes
    const imageSrc = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    // Replace double slashes
    images = [imageSrc.replace(/\/+/g, '/')];
    hasImage = true;
  }
  
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const price = product.dataIn?.price || product.paid || "0";

  useEffect(() => {
    setIsFavorite(isInFavorites(product.uuid));
  }, [product.uuid]);

  const handleToggleFavorite = () => {
    const newFavoriteState = toggleFavorite(product);
    setIsFavorite(newFavoriteState);
  };

  const handleAddToCart = () => {
    addToCart(product, undefined, quantity);
    setQuantity(1);
  };
  

  return (
    <section>
      <Container className="!px-0">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          <div className="lg:col-span-1">
            {hasImage && images.length > 0 ? (
              images.length > 1 ? (
                <Carousel setApi={setCarouselApi} className="w-full">
                  <CarouselContent>
                    {images.map((image, index) => (
                      <CarouselItem key={index}>
                        <div className="aspect-square w-full overflow-hidden rounded-xl bg-muted">
                          <img
                            src={image}
                            alt={`${product.title} ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              ) : (
                <div className="aspect-square w-full overflow-hidden rounded-xl bg-muted">
                  <img
                    src={images[0]}
                    alt={product.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )
            ) : (
              <div className="aspect-square w-full flex items-center justify-center rounded-xl bg-muted">
                <ShoppingCart className="size-16 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="mt-8 lg:col-span-1 lg:mt-0">
            <Badge variant="secondary">В наличии</Badge>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {product.title}
            </h1>
            <div className="mt-4 flex items-baseline gap-3">
              <p className="text-3xl font-medium text-foreground">{formatPrice(price)}</p>
              {product.dataIn?.weight && (
                <p className="text-lg text-muted-foreground">/ {product.dataIn.weight}</p>
              )}
            </div>
            {(() => {
              // Convert category slug to display name
              if (!product.category) return null;
              const cat = RESTAURANT_CATEGORIES.find(c => c.slug === product.category || c.name === product.category);
              const categoryDisplayName = cat ? cat.name : product.category;
              return (
                <p className="mt-2 text-sm text-muted-foreground">{categoryDisplayName}</p>
              );
            })()}
            <div className="mt-4 flex items-center gap-2">
              <RatingStars rating={5} />
            </div>

            <Separator className="my-8" />

            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center rounded-lg border">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Decrease quantity"
                >
                  <Minus className="size-4" />
                </Button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  aria-label="Increase quantity"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              <Button size="lg" className="flex-1" onClick={handleAddToCart}>
                Add to Cart
              </Button>
              <Button
                size="icon"
                variant={isFavorite ? "default" : "outline"}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                onClick={handleToggleFavorite}
              >
                <Heart className={cn("size-5", isFavorite && "fill-current")} />
              </Button>
            </div>

            <div className="mt-8">
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>
                <TabsContent value="description" className="mt-6">
                  {(product.dataIn?.description || product.title) && (
                    <div>
                      <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {product.dataIn?.description || product.title}
                      </p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="details" className="mt-6">
                  {(() => {
                    const attributes = product.dataIn?.attributes || {};
                    
                    // Helper function to get localized value
                    const getLocalizedValue = (value: string | { ru?: string; en?: string } | undefined): string => {
                      if (!value) return '';
                      if (typeof value === 'string') return value;
                      if (typeof value === 'object') {
                        const localeKey = currentLocale as 'ru' | 'en';
                        return value[localeKey] || value.ru || value.en || '';
                      }
                      return '';
                    };
                    
                    const attributeEntries = Object.entries(attributes)
                      .map(([key, value]) => {
                        const localizedValue = getLocalizedValue(value);
                        return [key, localizedValue] as [string, string];
                      })
                      .filter(([_, value]) => value && value.trim() !== '');
                    
                    // Mapping attribute keys to display names
                    const attributeLabels: Record<string, string> = {
                      country: 'Country',
                      length: 'Length',
                      weight: 'Weight',
                      vbn: 'VBN',
                    };
                    
                    if (attributeEntries.length === 0) {
                      return (
                        <p className="text-muted-foreground">Details not specified</p>
                      );
                    }
                    
                    return (
                      <div className="rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[200px]">Attribute</TableHead>
                              <TableHead>Value</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {attributeEntries.map(([key, value]) => (
                              <TableRow key={key}>
                                <TableCell className="font-medium">
                                  {attributeLabels[key] || (key.charAt(0).toUpperCase() + key.slice(1))}
                                </TableCell>
                                <TableCell>{value}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    );
                  })()}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}