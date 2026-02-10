"use client";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { Dispatch, SetStateAction, useEffect, useLayoutEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { Container } from "@/components/misc/layout/Container";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

interface NavLink {
  title: string;
  url: string;
}

interface MobileNavigationMenuProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  localePath: string;
  labels: typeof DEFAULT_NAV_LABELS & { home: string; members: string; mentors: string; meetLifely: string };
}

const LOGO = {
  src: "/images/logo.svg",
  alt: "Lifely",
};

const DEFAULT_NAV_LABELS = {
  home: "Home",
  members: "Feel supported with Lifely",
  mentors: "Lifely for Mentors",
  meetLifely: "Meet Lifely",
};

const MOBILE_BREAKPOINT = 1024;

export interface Navbar8Labels {
  home?: string;
  members?: string;
  mentors?: string;
  meetLifely?: string;
}

interface Navbar8Props {
  className?: string;
  localePath?: string;
  labels?: Navbar8Labels;
}

function buildHref(localePath: string | undefined, path: string): string {
  return `${localePath ?? ""}${path}`;
}

const Navbar8 = ({ className, localePath = "", labels: labelsProp }: Navbar8Props) => {
  const labels = { ...DEFAULT_NAV_LABELS, ...labelsProp };
  const navigation: NavLink[] = [
    { title: labels.members, url: "/members" },
    { title: labels.mentors, url: "/mentors" },
  ];
  const meetLifelyLabel = labels.meetLifely;
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > MOBILE_BREAKPOINT) {
        setOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  const handleMobileMenu = () => {
    setOpen((prev) => !prev);
  };

  return (
    <section className={cn("", className)}>
      <div className="sticky top-0 z-500 w-full border-b bg-background/95 backdrop-blur">
        <Container className="border-b-0">
          <div className="flex items-center justify-between gap-3.5 py-5">
            <Link
              href={buildHref(localePath, "/")}
              className="flex shrink-0 items-center gap-2 text-lg font-semibold tracking-tighter"
            >
              <img
                src={LOGO.src}
                alt={LOGO.alt}
                className="inline-block h-9 w-auto sm:h-10"
              />
            </Link>
            <NavigationMenu className="hidden lg:flex [&>div:nth-child(2)]:left-1/2 [&>div:nth-child(2)]:-translate-x-1/2">
              <NavigationMenuList>
                {navigation.map((item, index) => (
                  <NavigationMenuItem
                    key={`desktop-link-${index}`}
                    value={`${index}`}
                    className={`${navigationMenuTriggerStyle()} bg-transparent`}
                  >
                    <NavigationMenuLink asChild>
                      <Link href={buildHref(localePath, item.url)}>
                        {item.title}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
            <div className="flex items-center gap-3.5">
              <div className="hidden lg:block">
                <Button variant="default" asChild className="rounded-full">
                  <Link href={buildHref(localePath, "/meet-us")}>
                    {meetLifelyLabel}
                  </Link>
                </Button>
              </div>
              <div className="lg:hidden">
                <Button variant="ghost" size="icon" onClick={handleMobileMenu}>
                  <Menu className="size-5.5" />
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </div>
      <MobileNavigationMenu
        open={open}
        setOpen={setOpen}
        localePath={localePath}
        labels={labels}
      />
    </section>
  );
};

const MobileNavigationMenu = ({ open, setOpen, localePath, labels }: MobileNavigationMenuProps) => {
  const mobileNav: NavLink[] = [
    { title: labels.members, url: "/members" },
    { title: labels.mentors, url: "/mentors" },
  ];

  useLayoutEffect(() => {
    if (!open) {
      document.documentElement.style.removeProperty("--removed-body-scroll-bar-size");
      document.documentElement.style.removeProperty("padding-right");
      document.body.style.removeProperty("padding-right");
      return;
    }
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth || 17;
    const padding = `${scrollbarWidth}px`;
    document.documentElement.style.setProperty("--removed-body-scroll-bar-size", padding);
    document.documentElement.style.setProperty("padding-right", padding);
    document.body.style.setProperty("padding-right", padding);
    return () => {
      document.documentElement.style.removeProperty("--removed-body-scroll-bar-size");
      document.documentElement.style.removeProperty("padding-right");
      document.body.style.removeProperty("padding-right");
    };
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={setOpen} modal={true}>
      <SheetContent
        side="right"
        className="z-601 w-[min(calc(100vw-1.5rem),22rem)] max-w-[22rem] bg-primary text-primary-foreground border-0 p-0 [&>button]:hidden"
      >
        <SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
        <div className="flex h-full flex-col gap-6 p-6">
          <div className="flex justify-end">
            <SheetClose asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Close menu"
                className="size-12 shrink-0 rounded-full border-2 border-primary-foreground bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <X className="size-7 shrink-0 stroke-[2.5]" aria-hidden />
              </Button>
            </SheetClose>
          </div>
          <nav className="flex flex-col gap-3">
            <SheetClose asChild>
              <Link
                href={buildHref(localePath, "/")}
                className="text-base text-primary-foreground underline-offset-4 hover:underline"
              >
                {labels.home}
              </Link>
            </SheetClose>
            {mobileNav.map((item, index) => (
              <SheetClose key={`mobile-nav-link-${index}`} asChild>
                <Link
                  href={buildHref(localePath, item.url)}
                  className="text-base text-primary-foreground underline-offset-4 hover:underline"
                >
                  {item.title}
                </Link>
              </SheetClose>
            ))}
            <SheetClose asChild>
              <Link
                href={buildHref(localePath, "/meet-us")}
                className="mt-2 w-fit rounded-full bg-primary-foreground px-4 py-2 text-base font-medium text-primary"
              >
                {labels.meetLifely}
              </Link>
            </SheetClose>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export { Navbar8 };
