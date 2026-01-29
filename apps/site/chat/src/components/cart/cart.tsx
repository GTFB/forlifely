"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, Shield, Tag, Trash2, Truck, ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Container } from "@/components/Container";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getCart, updateCartItemQuantity, removeFromCart, setPromocode, removePromocode } from "@/lib/cart";
import { formatPrice } from "@/lib/format-price";
import { fetchProducts, parseProduct } from "@/lib/api/products";
import { getProductSlug, getCategorySlug } from "@/lib/slug";
import { RESTAURANT_CATEGORIES } from "@/lib/api/categories";
import { ProductCard } from "@/components/product/product-card";
import type { Cart } from "@/types/cart";
import type { ProductParsed } from "@/types/product";

interface PromocodeResponse {
  id?: number;
  uuid?: string;
  oaid?: string;
  code: string;
  title: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  quantity?: number;
  used?: number;
  available?: number;
  description?: string;
  error?: string;
  details?: string;
}

interface PromocodeApplyResponse {
  success?: boolean;
  code: string;
  title: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  discount: number;
  cartTotal?: number;
  finalTotal?: number;
  available?: number;
  error?: string;
  details?: string;
}

export function ShoppingCartPage() {
  const [cart, setCart] = useState<Cart>({ items: [], total: 0, itemCount: 0, promocode: null });
  const [relatedProducts, setRelatedProducts] = useState<ProductParsed[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [promocodeInput, setPromocodeInput] = useState("");
  const [promocodeError, setPromocodeError] = useState<string | null>(null);
  const [isApplyingPromocode, setIsApplyingPromocode] = useState(false);
  const [shipping, setShipping] = useState(0);
  const [shippingSettings, setShippingSettings] = useState<{ freeShippingThreshold: number; shippingCost: number } | null>(null);

  useEffect(() => {
    const updateCart = () => {
      setCart(getCart());
    };

    updateCart();
    const interval = setInterval(updateCart, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fetch shipping settings
    const fetchShippingSettings = async () => {
      try {
        const response = await fetch('/api/shipping');
        if (response.ok) {
          const settings = await response.json() as { freeShippingThreshold: number; shippingCost: number };
          setShippingSettings(settings);
        }
      } catch (error) {
        console.error('Error fetching shipping settings:', error);
      }
    };

    fetchShippingSettings();
  }, []);

  useEffect(() => {
    // Calculate shipping cost when cart total or settings change
    const calculateShipping = async () => {
      if (!shippingSettings) {
        setShipping(0);
        return;
      }

      const subtotal = cart.total - (cart.promocode?.discount || 0);
      const calculatedShipping = subtotal >= shippingSettings.freeShippingThreshold 
        ? 0 
        : shippingSettings.shippingCost;
      
      setShipping(calculatedShipping);
    };

    calculateShipping();
  }, [cart.total, cart.promocode, shippingSettings]);

  const getCategoryDisplayName = (categorySlug: string | undefined): string | null => {
    if (!categorySlug) return null;
    const category = RESTAURANT_CATEGORIES.find(cat => cat.slug === categorySlug || cat.name === categorySlug);
    return category ? category.name : categorySlug;
  };

  useEffect(() => {
    const loadRelatedProducts = async () => {
      try {
        setLoadingRelated(true);
        const response = await fetchProducts({ pageSize: 20 });
        if (response.success) {
          const parsedProducts = response.data.map(parseProduct);
          const currentCart = getCart();
          // Get all product UUIDs from cart items
          const cartProductUuids = new Set(
            currentCart.items.map(item => item.productUuid).filter(Boolean)
          );
          
          // Filter out products that are already in cart by UUID
          const filteredProducts = parsedProducts.filter(
            product => product.uuid && !cartProductUuids.has(product.uuid)
          );
          
          // Take first 4 products that are not in cart
          setRelatedProducts(filteredProducts.slice(0, 4));
        }
      } catch (error) {
        console.error("Failed to load related products:", error);
      } finally {
        setLoadingRelated(false);
      }
    };

    loadRelatedProducts();
  }, [cart.items]); // Reload when cart items change (not just length)

  const handleQuantityChange = (itemId: string, quantity: number) => {
    updateCartItemQuantity(itemId, quantity);
    setCart(getCart());
  };

  const handleRemoveItem = (itemId: string) => {
    removeFromCart(itemId);
    setCart(getCart());
  };

  const getImageSrc = (image?: string) => {
    if (!image) return undefined;
    if (image.startsWith('http')) return image;
    // Ensure path starts with / and normalize
    let path = image.startsWith('/') ? image : `/${image}`;
    path = path.replace(/\/+/g, '/');
    return path;
  };

  const handleApplyPromocode = async () => {
    const code = promocodeInput.trim().toUpperCase();
    if (!code) {
      setPromocodeError("Enter promocode");
      return;
    }

    setIsApplyingPromocode(true);
    setPromocodeError(null);

    try {
      const response = await fetch(`/api/promocodes?code=${encodeURIComponent(code)}`);
      const data = await response.json() as PromocodeResponse;

      if (!response.ok) {
        setPromocodeError(data.error || "Error checking promocode");
        return;
      }

      // Apply promocode
      const applyResponse = await fetch("/api/promocodes/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, cartTotal: cart.total }),
      });

      const applyData = await applyResponse.json() as PromocodeApplyResponse;

      if (!applyResponse.ok) {
        setPromocodeError(applyData.error || "Error applying promocode");
        return;
      }

      // Save promocode to cart
      const updatedCart = getCart();
      setPromocode(updatedCart, {
        code: applyData.code,
        title: applyData.title,
        discountType: applyData.discountType,
        discountValue: applyData.discountValue,
        discount: applyData.discount,
      });
      setCart(getCart());
      setPromocodeInput("");
    } catch (error) {
      console.error("Error applying promocode:", error);
      setPromocodeError("Error applying promocode");
    } finally {
      setIsApplyingPromocode(false);
    }
  };

  const handleRemovePromocode = () => {
    const updatedCart = getCart();
    removePromocode(updatedCart);
    setCart(getCart());
    setPromocodeInput("");
    setPromocodeError(null);
  };

  const discount = cart.promocode?.discount || 0;
  const total = Math.max(0, cart.total - discount + shipping);

  if (cart.items.length === 0) {
    return (
      <section className="py-8">
        <Container>
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 size-4" />
                Continue Shopping
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-balance">Shopping Cart</h1>
            <p className="text-muted-foreground mt-2">Your cart is empty</p>
          </div>
          <Card className="py-12">
            <CardContent className="text-center">
              <ShoppingCart className="size-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Your cart is empty</p>
              <Link href="/">
                <Button>Start Shopping</Button>
              </Link>
            </CardContent>
          </Card>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-8">
      <Container>
        <div className="flex justify-between items-center mb-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Cart</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-balance">Shopping Cart</h1>
          <p className="text-muted-foreground mt-2">{cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'} in cart</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="py-6">
              <CardHeader className="px-6">
                <CardTitle>Items in Cart</CardTitle>
              </CardHeader>
              <CardContent className="px-6 space-y-6">
                {cart.items.map((item, index) => {
                  const imageSrc = getImageSrc(item.image);
                  return (
                    <div key={item.id}>
                      <div className="flex items-start gap-4">
                        {imageSrc ? (
                          <img
                            alt={item.name}
                            className="h-20 w-20 rounded-lg object-cover flex-shrink-0"
                            src={imageSrc}
                          />
                        ) : (
                          <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <ShoppingCart className="size-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="line-clamp-2 font-medium">{item.name}</h3>
                              {item.category && (
                                <p className="text-muted-foreground text-sm">
                                  {getCategoryDisplayName(item.category)}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{formatPrice(item.price)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center rounded-md border">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="size-4" />
                                </Button>
                                <span className="min-w-[2rem] text-center text-sm">{item.quantity}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                >
                                  <Plus className="size-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {index < cart.items.length - 1 && <Separator className="mt-6" />}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="py-6 sticky top-20">
              <CardHeader className="px-6">
                <CardTitle>Total</CardTitle>
              </CardHeader>
              <CardContent className="px-6 space-y-4">
                {/* Promocode section */}
                <div className="space-y-2">
                  {cart.promocode ? (
                    <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950 rounded-md">
                      <div className="flex items-center gap-2">
                        <Tag className="size-4 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="text-sm font-medium text-green-900 dark:text-green-100">
                            {cart.promocode.title}
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-300">
                            {cart.promocode.code}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemovePromocode}
                        className="h-6 px-2 text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Promocode"
                          value={promocodeInput}
                          onChange={(e) => {
                            setPromocodeInput(e.target.value.toUpperCase());
                            setPromocodeError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleApplyPromocode();
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          onClick={handleApplyPromocode}
                          disabled={isApplyingPromocode || !promocodeInput.trim()}
                          variant="outline"
                        >
                          <Tag className="size-4" />
                        </Button>
                      </div>
                      {promocodeError && (
                        <p className="text-xs text-red-600 dark:text-red-400">{promocodeError}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal ({cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'})</span>
                    <span>{formatPrice(cart.total)}</span>
                  </div>
                  {cart.promocode && discount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Discount ({cart.promocode.code})</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? "text-green-600" : ""}>
                      {shipping === 0 ? "Free" : formatPrice(shipping)}
                    </span>
                  </div>
                  {shippingSettings && cart.total - discount < shippingSettings.freeShippingThreshold && (
                    <div className="text-xs text-muted-foreground">
                      {formatPrice(shippingSettings.freeShippingThreshold - (cart.total - discount))} until free shipping
                    </div>
                  )}
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <Link href="/checkout">
                  <Button size="lg" className="w-full">Checkout</Button>
                </Link>
                <div className="space-y-3 text-sm">
                  {shippingSettings && (
                    <div className="flex items-center gap-2 text-green-600 mt-4">
                      <Truck className="size-4" />
                      <span>Free shipping from {formatPrice(shippingSettings.freeShippingThreshold)}</span>
                    </div>
                  )}
                  <div className="text-muted-foreground flex items-center gap-2">
                    <Shield className="size-4" />
                    <span>Secure payment</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h3 className="mb-4 text-lg font-semibold">You may also like</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((product) => (
                <ProductCard 
                  key={product.uuid} 
                  product={product} 
                  onCartUpdate={() => setCart(getCart())}
                />
              ))}
            </div>
          </div>
        )}

      </Container>
    </section>
  );
}