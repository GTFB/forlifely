"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, ShoppingCart, MapPin, Heart, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCart } from "@/lib/cart";
import { getFavorites } from "@/lib/favorites";
import { CartDialog } from "./cart-dialog";
import { Container } from "@/components/Container";
import { RestaurantStatusBadge } from "@/components/ui/restaurant-status-badge";
import { Logo } from "@/packages/components/misc/logo/logo";

const navLinks = [
  { href: "/", label: "Главная" },
  { href: "/catalog", label: "Меню" },
  { href: "/news", label: "Новости" },
  { href: "/about", label: "О нас" },
  { href: "/contacts", label: "Контакты" },
];

export function Header() {
  const [cartItemCount, setCartItemCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartDialogOpen, setCartDialogOpen] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(true);

  useEffect(() => {
    const updateCartCount = () => {
      const cart = getCart();
      setCartItemCount(cart.itemCount);
    };

    const updateFavoritesCount = () => {
      const favorites = getFavorites();
      setFavoritesCount(favorites.length);
    };

    updateCartCount();
    updateFavoritesCount();
    const interval = setInterval(() => {
      updateCartCount();
      updateFavoritesCount();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Плавающая кнопка всегда видна на мобильных устройствах
  useEffect(() => {
    setShowFloatingButton(true);
  }, []);

  return (
    <>
      <header className="border-b sticky top-0 z-50 bg-[#E6DDD2]/95 backdrop-blur supports-[backdrop-filter]:bg-[#E6DDD2]/60">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer lg:hidden"
                aria-label="Menu"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="size-5" />
              </Button>

              <Link href="/" className="flex items-center gap-2 -ml-2">
                <Logo />
              </Link>

              <nav className="hidden lg:block">
                <ul className="flex items-center gap-6">
                  {navLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm font-medium transition-colors hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            <div className="flex items-center gap-6">
              {/* Group 1: Location + Status */}
              <div className="flex items-center gap-2">
                <Link href="/contacts" className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <MapPin className="size-4" />
                  <span className="hidden md:inline">Адлер, ул. Бестужева, 1/1</span>
                </Link>
                <RestaurantStatusBadge variant="secondary" className="hidden sm:flex" />
              </div>
              
              {/* Group 2: Social + Phone */}
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="https://t.me/s/craft_house_adler"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Telegram"
                    className="text-primary hover:text-primary hover:bg-primary/10"
                  >
                    <svg
                      className="size-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                  </Button>
                </Link>
                <Link
                  href="https://wa.me/79388880302"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="WhatsApp"
                    className="text-primary hover:text-primary hover:bg-primary/10"
                  >
                    <svg
                      className="size-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  </Button>
                </Link>
                <Link href="tel:+79388880302" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  +7 (938) 888-03-02
                </Link>
              </div>
              
              {/* Group 3: Favorites + Cart */}
              <div className="flex items-center gap-2">
                <Link href="/favorites">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-primary hover:text-primary hover:bg-primary/10"
                    aria-label="Избранное"
                  >
                    <Heart className="size-5" />
                    {favoritesCount > 0 && (
                      <span className="bg-primary text-primary-foreground absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full text-xs">
                        {favoritesCount}
                      </span>
                    )}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-primary hover:text-primary hover:bg-primary/10"
                  aria-label="Корзина"
                  onClick={() => setCartDialogOpen(true)}
                >
                  <ShoppingCart className="size-5" />
                  {cartItemCount > 0 && (
                    <span className="bg-primary text-primary-foreground absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full text-xs">
                      {cartItemCount}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {mobileMenuOpen && (
            <nav className="lg:hidden border-t py-4">
              <ul className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium transition-colors hover:text-primary block py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </Container>
      </header>
      <CartDialog open={cartDialogOpen} onOpenChange={setCartDialogOpen} />
      {/* Floating Call Button for Mobile */}
      <div className={`fixed bottom-4 right-4 z-50 transition-opacity duration-300 ${showFloatingButton ? 'opacity-100' : 'opacity-0 pointer-events-none'} md:hidden`}>
        <Button
          asChild
          size="icon"
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg w-14 h-14"
        >
          <Link href="tel:+79388880302" aria-label="Позвонить">
            <Phone className="size-6" />
          </Link>
        </Button>
      </div>
    </>
  );
}
