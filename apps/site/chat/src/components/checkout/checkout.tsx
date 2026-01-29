"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, CreditCard, Minus, Plus, Shield, Trash2, Wallet, ShoppingCart, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Container } from "@/components/Container";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getCart, updateCartItemQuantity, removeFromCart, clearCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format-price";
import { getRestaurantStatus, type RestaurantStatus } from "@/lib/restaurant-status";
import { RESTAURANT_CATEGORIES } from "@/lib/api/categories";
import { saveCheckoutData, getCheckoutData } from "@/lib/checkout-cookies";
import type { Cart } from "@/types/cart";

interface CheckoutFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  comment: string;
}

export function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart>({ items: [], total: 0, itemCount: 0, promocode: null });
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: "",
    phone: "",
    email: "",
    address: "",
    comment: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restaurantStatus, setRestaurantStatus] = useState<RestaurantStatus>(getRestaurantStatus());
  const [shipping, setShipping] = useState(0);
  const [shippingSettings, setShippingSettings] = useState<{ freeShippingThreshold: number; shippingCost: number } | null>(null);
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  useEffect(() => {
    const updateCart = () => {
      const currentCart = getCart();
      setCart(currentCart);
      
      // Redirect to cart if empty, but only if we're not submitting an order
      if (currentCart.items.length === 0 && !isSubmitting && !orderSubmitted) {
        router.push("/cart");
      }
    };

    updateCart();
    const interval = setInterval(updateCart, 500);

    return () => clearInterval(interval);
  }, [router, isSubmitting, orderSubmitted]);

  useEffect(() => {
    // Update restaurant status every minute
    const updateStatus = () => {
      setRestaurantStatus(getRestaurantStatus());
    };

    updateStatus();
    const interval = setInterval(updateStatus, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Load saved checkout data from cookie
    const savedData = getCheckoutData();
    if (savedData && Object.keys(savedData).length > 0) {
      setFormData(prev => ({
        ...prev,
        ...savedData,
      }));
    }
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

  const handleQuantityChange = (itemId: string, quantity: number) => {
    updateCartItemQuantity(itemId, quantity);
    setCart(getCart());
  };
  
  const handleRemoveItem = (itemId: string) => {
    removeFromCart(itemId);
    setCart(getCart());
  };

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Save to cookie on change (debounced would be better, but this is simpler)
      saveCheckoutData(updated);
      return updated;
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!formData.phone.trim()) {
      setError("Please enter your phone number");
      return;
    }
    if (!formData.address.trim()) {
      setError("Please enter delivery address");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare order items
      const orderItems = cart.items.map(item => ({
        productId: item.productUuid || '',
        paid: item.paid || item.productUuid || '', // Use paid if available, fallback to productUuid
        title: item.name || '',
        price: item.price,
        quantity: item.quantity,
        image: item.image || undefined,
      }));

      // Send order to API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || undefined,
          address: formData.address,
          comment: formData.comment || undefined,
          paymentMethod,
          items: orderItems,
          total: total,
          discount: discount,
          promocode: cart.promocode?.code || null,
          tax: 0,
          shipping: shipping,
        }),
      });

      const data = await response.json() as { error?: string; success?: boolean; details?: string };

      if (!response.ok) {
        const errorMessage = data.error || data.details || 'Error placing order';
        console.error('Order API error:', errorMessage);
        throw new Error(errorMessage);
      }
      
      // Mark order as submitted to prevent redirect to cart
      setOrderSubmitted(true);
      
      // Save form data to cookie before clearing cart
      saveCheckoutData(formData);
      
      // Clear cart after successful order
      clearCart();
      
      // Redirect to success page
      router.push("/order-success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error placing order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getImageSrc = (image?: string) => {
    if (!image) return undefined;
    if (image.startsWith('http')) return image;
    let path = image.startsWith('/') ? image : `/${image}`;
    path = path.replace(/\/+/g, '/');
    return path;
  };

  const getCategoryDisplayName = (categorySlug: string | undefined): string | null => {
    if (!categorySlug) return null;
    const category = RESTAURANT_CATEGORIES.find(cat => cat.slug === categorySlug || cat.name === categorySlug);
    return category ? category.name : categorySlug;
  };

  const discount = cart.promocode?.discount || 0;
  const total = Math.max(0, cart.total - discount + shipping);

  if (cart.items.length === 0) {
    return null; // Will redirect to cart
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <Container className="py-8">
          <div className="flex justify-between items-center mb-8">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/cart">Cart</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Checkout</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Link href="/cart">
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-balance">Checkout</h1>
            <p className="text-muted-foreground">Review your order and complete checkout</p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className="py-6">
                <CardHeader className="px-6">
                  <CardTitle className="flex items-center justify-between text-balance">
                    <span>Your Order</span>
                    <Badge variant="secondary">{cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'}</Badge>
                  </CardTitle>
                  <CardDescription>Review items before checkout</CardDescription>
                </CardHeader>
                <CardContent className="px-6">
                  <div className="space-y-4">
                    {cart.items.map(item => {
                      const imageSrc = getImageSrc(item.image);
                      return (
                        <div key={item.id} className="flex gap-4 rounded-lg border p-4">
                          <div className="relative">
                            {imageSrc ? (
                              <img alt={item.name} className="h-24 w-24 rounded-lg object-cover" src={imageSrc} />
                            ) : (
                              <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center">
                                <ShoppingCart className="size-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex items-start justify-between">
                              <div>
                                <h3 className="text-sm leading-tight font-semibold">{item.name}</h3>
                                {item.category && (
                                  <p className="text-muted-foreground text-xs font-medium">
                                    {getCategoryDisplayName(item.category)}
                                  </p>
                                )}
                              </div>
                              <Button 
                                type="button"
                                variant="ghost" 
                                size="icon" 
                                className="hover:bg-destructive/10 hover:text-destructive size-8" 
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button 
                                  type="button"
                                  variant="outline" 
                                  size="icon" 
                                  className="size-8 p-0" 
                                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)} 
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="size-3" />
                                </Button>
                                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                <Button 
                                  type="button"
                                  variant="outline" 
                                  size="icon" 
                                  className="size-8 p-0" 
                                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                >
                                  <Plus className="size-3" />
                                </Button>
                              </div>
                              <div className="text-end">
                                <div className="font-semibold">{formatPrice(item.price * item.quantity)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="py-6">
                <CardHeader className="px-6">
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>Enter your details for delivery</CardDescription>
                </CardHeader>
                <CardContent className="px-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input 
                      id="name" 
                      placeholder="John Doe" 
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input 
                      id="phone" 
                      placeholder="+1 (555) 123-4567" 
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      placeholder="john@example.com" 
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Delivery Address *</Label>
                    <Textarea 
                      id="address" 
                      placeholder="Street, house, apartment" 
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comment">Order Comment</Label>
                    <Textarea 
                      id="comment" 
                      placeholder="Additional information" 
                      value={formData.comment}
                      onChange={(e) => handleInputChange("comment", e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
              <Card className="py-6">
                <CardHeader className="px-6">
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription>Choose payment method for your order</CardDescription>
                </CardHeader>
                <CardContent className="px-6">
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid gap-3">
                    <Label htmlFor="payment-cash" className={cn("flex cursor-pointer items-center space-x-2 rounded-lg border-2 p-4 transition-colors", paymentMethod === 'cash' ? 'border-primary bg-accent/30' : 'border-border hover:bg-accent/50')}>
                      <RadioGroupItem value="cash" id="payment-cash" />
                      <div className="flex flex-1 items-center space-x-3">
                        <Wallet className="size-5" />
                        <div>
                          <div className="font-medium">Cash on Delivery</div>
                          <div className="text-muted-foreground text-sm">Pay to courier</div>
                        </div>
                      </div>
                      {paymentMethod === 'cash' && <Check className="text-primary size-5" />}
                    </Label>
                    <Label htmlFor="payment-card" className={cn("flex cursor-pointer items-center space-x-2 rounded-lg border-2 p-4 transition-colors", paymentMethod === 'card' ? 'border-primary bg-accent/30' : 'border-border hover:bg-accent/50')}>
                      <RadioGroupItem value="card" id="payment-card" />
                      <div className="flex flex-1 items-center space-x-3">
                        <CreditCard className="size-5" />
                        <div>
                          <div className="font-medium">Card to Courier</div>
                          <div className="text-muted-foreground text-sm">VISA, Mastercard</div>
                        </div>
                      </div>
                      {paymentMethod === 'card' && <Check className="text-primary size-5" />}
                    </Label>
                  </RadioGroup>
                </CardContent>
              </Card>
              
              {error && (
                <Card className="py-4 border-destructive">
                  <CardContent className="px-6">
                    <p className="text-destructive text-sm">{error}</p>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <div className="lg:col-span-1">
              <Card className="py-6 sticky top-20">
                <CardHeader className="px-6">
                  <CardTitle>Total</CardTitle>
                </CardHeader>
                <CardContent className="px-6 space-y-4">
                  <Separator />
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal ({cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'})</span>
                      <span>{formatPrice(cart.total)}</span>
                    </div>
                    {cart.promocode && discount > 0 && (
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span>Discount ({cart.promocode.code})</span>
                        <span>-{formatPrice(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
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
                  
                  {!restaurantStatus.isOpen && (
                    <div className="mb-4 rounded-lg bg-red-600 p-4">
                      <p className="font-semibold text-white text-center">
                        ATTENTION! Your order will be processed after we open at 10:00
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    type="submit"
                    size="lg" 
                    className="h-12 w-full text-base font-semibold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Processing..." : `Place Order • ${formatPrice(total)}`}
                  </Button>
                  <div className="space-y-3 border-t pt-4 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Shield className="size-4 text-green-600" />
                      <span>Secure payment</span>
                    </div>
                    {shippingSettings && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Check className="size-4 text-green-600" />
                        <span>Free shipping from {formatPrice(shippingSettings.freeShippingThreshold)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </div>
    </form>
  );
}