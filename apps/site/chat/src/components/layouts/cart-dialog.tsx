"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, Minus, Plus, ShoppingCart, X, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { getCart, updateCartItemQuantity, removeFromCart, setPromocode, removePromocode } from "@/lib/cart";
import { formatPrice } from "@/lib/format-price";
import { RESTAURANT_CATEGORIES } from "@/lib/api/categories";
import type { Cart } from "@/types/cart";

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

export function CartDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [cart, setCart] = useState<Cart>({ items: [], total: 0, itemCount: 0, promocode: null });
  const [promocodeInput, setPromocodeInput] = useState("");
  const [promocodeError, setPromocodeError] = useState<string | null>(null);
  const [isApplyingPromocode, setIsApplyingPromocode] = useState(false);

  useEffect(() => {
    const updateCart = () => {
      setCart(getCart());
    };

    updateCart();
    const interval = setInterval(updateCart, 500);

    return () => clearInterval(interval);
  }, []);

  // Fix scrollbar shift when cart dialog opens
  useEffect(() => {
    if (open) {
      // Calculate scrollbar width
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Add padding to body to compensate for scrollbar
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      
      return () => {
        // Remove padding when dialog closes
        document.body.style.paddingRight = '';
      };
    }
  }, [open]);

  const handleQuantityChange = (itemId: string, quantity: number) => {
    updateCartItemQuantity(itemId, quantity);
    setCart(getCart());
  };

  const handleRemoveItem = (itemId: string) => {
    removeFromCart(itemId);
    setCart(getCart());
  };

  const handleApplyPromocode = async () => {
    const code = promocodeInput.trim().toUpperCase();
    if (!code) {
      setPromocodeError("Enter promo code");
      return;
    }

    setIsApplyingPromocode(true);
    setPromocodeError(null);

    try {
      const response = await fetch(`/api/promocodes?code=${encodeURIComponent(code)}`);
      const data = await response.json() as PromocodeResponse;

      if (!response.ok) {
        setPromocodeError(data.error || "Error checking promo code");
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
        setPromocodeError(applyData.error || "Error applying promo code");
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
      setPromocodeError("Error applying promo code");
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

  // Рассчитываем итоговую сумму с учетом скидки
  const discount = cart.promocode?.discount || 0;
  const total = Math.max(0, cart.total - discount);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="size-5" />
            Cart ({cart.itemCount})
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.items.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>Cart is empty</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    {item.image ? (
                      <img
                        alt={item.name}
                        className="h-16 w-16 rounded-md object-cover flex-shrink-0"
                        src={item.image}
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                        <ShoppingCart className="size-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 space-y-1 min-w-0">
                      <h3 className="line-clamp-2 text-sm font-medium">{item.name}</h3>
                      {item.category && (
                        <p className="text-muted-foreground text-xs">
                          {(() => {
                            const category = RESTAURANT_CATEGORIES.find(cat => cat.slug === item.category || cat.name === item.category);
                            return category ? category.name : item.category;
                          })()}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold">{formatPrice(item.price)}</span>
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 p-0"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="size-3" />
                          </Button>
                          <span className="mx-2 w-6 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 p-0"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          >
                            <Plus className="size-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ms-2 size-6 p-0 text-red-600 hover:text-red-700"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <X className="size-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {cart.items.length > 0 && (
          <div className="border-t px-6 py-4 space-y-4 bg-background">
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
                      placeholder="Promo code"
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
                      size="sm"
                    >
                      Apply
                    </Button>
                  </div>
                  {promocodeError && (
                    <p className="text-xs text-red-600 dark:text-red-400">{promocodeError}</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(cart.total)}</span>
              </div>
              {cart.promocode && discount > 0 && (
                <>
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Discount ({cart.promocode.code})</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Link href="/cart" onClick={() => onOpenChange(false)}>
                <Button className="w-full">Go to Cart</Button>
              </Link>
              <Link href="/checkout" onClick={() => onOpenChange(false)}>
                <Button variant="outline" className="w-full">Checkout</Button>
              </Link>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
                <Clock className="size-3" />
                <span>Order confirmation within 30-60 minutes</span>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
