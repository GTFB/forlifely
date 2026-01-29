"use client";

import {
  Brain,
  ChevronRight,
  LucideIcon,
  Menu,
  PenTool,
  X,
} from "lucide-react";
import { Fragment, useEffect, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Container } from "@/packages/components/misc/layout/Container";

interface MenuLink {
  label: string;
  description?: string;
  url?: string;
  icon?: {
    component: LucideIcon;
    color: string;
  };
}
interface MenuItem {
  title: string;
  url?: string;
  links?: MenuLink[];
}

interface DesktopMenuItemProps {
  item: MenuItem;
  index: number;
}

interface MobileNavigationMenuProps {
  open: boolean;
}

interface MenuSubLinkProps {
  link: MenuLink;
}

const LOGO = {
  url: "/",
  title: "NeuroPublisher",
};

const NAVIGATION: MenuItem[] = [
  {
    title: "Возможности",
    url: "#features",
  },
  {
    title: "Как это работает",
    url: "#technology",
  },
  {
    title: "Цены",
    url: "#pricing",
  },
  {
    title: "FAQ",
    url: "#faq",
  },
];

const PRIMARY_BUTTON = {
  label: "Попробовать бесплатно",
  url: "#",
};

const LOGIN_BUTTON = {
  label: "Войти",
  url: "#",
};

const MOBILE_BREAKPOINT = 1024;

const Navbar9 = () => {
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > MOBILE_BREAKPOINT) {
        setOpen(false);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  const handleMobileMenu = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
  };

  return (
    <Fragment>
      <section className="z-999 bg-background dark pointer-events-auto fixed top-0 left-0 right-0 w-full">
        <Container className="h-16">
          <div className="flex h-full items-center justify-between">
            <a
              href={LOGO.url}
              className="flex max-h-8 items-center gap-2 text-lg font-semibold tracking-tighter"
            >
              <div className="flex items-center gap-1.5">
                <Brain className="size-6 text-violet-600 dark:text-violet-400" />
                <PenTool className="size-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-foreground hidden md:inline-block">
                {LOGO.title}
              </span>
            </a>
            <NavigationMenu className="hidden lg:flex">
              <NavigationMenuList className="">
                {NAVIGATION.map((item, index) => (
                  <DesktopMenuItem
                    key={`desktop-link-${index}`}
                    item={item}
                    index={index}
                  />
                ))}
              </NavigationMenuList>
            </NavigationMenu>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild className="hidden lg:flex">
                <a href={LOGIN_BUTTON.url}>{LOGIN_BUTTON.label}</a>
              </Button>
              <Button asChild>
                <a href={PRIMARY_BUTTON.url}>{PRIMARY_BUTTON.label}</a>
              </Button>
              <div className="lg:hidden">
                <Button variant="ghost" size="icon" onClick={handleMobileMenu}>
                  {open ? (
                    <X className="size-5.5 stroke-foreground" />
                  ) : (
                    <Menu className="size-5.5 stroke-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>
      <MobileNavigationMenu open={open} />
    </Fragment>
  );
};

const DesktopMenuItem = ({ item, index }: DesktopMenuItemProps) => {
  if (item.links) {
    return (
      <NavigationMenuItem key={`desktop-menu-item-${index}`} value={`${index}`}>
        <NavigationMenuTrigger className="text-foreground h-fit bg-transparent font-normal focus:!bg-transparent data-[active=true]:!bg-transparent">
          {item.title}
        </NavigationMenuTrigger>
        <NavigationMenuContent className="!rounded-xl !p-0">
          <ul className="w-[20rem] p-2.5">
            {item.links.map((link, index) => (
              <li key={`desktop-nav-sublink-${index}`}>
                <MenuSubLink link={link} />
              </li>
            ))}
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem key={`desktop-menu-item-${index}`} value={`${index}`}>
      <NavigationMenuLink
        href={item.url}
        className={`${navigationMenuTriggerStyle()} text-foreground h-fit bg-transparent font-normal`}
      >
        {item.title}
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
};

const MenuSubLink = ({ link }: MenuSubLinkProps) => {
  return (
    <a
      href={link.url}
      className="hover:bg-muted flex items-center gap-4 rounded-lg p-2"
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex gap-2.5">
          {link.icon && (
            <link.icon.component
              className="size-5"
              style={{ stroke: link.icon.color }}
            />
          )}
          <div className="flex flex-col gap-1.5">
            <h3 className="text-foreground text-sm leading-none">
              {link.label}
            </h3>
            <p className="text-muted-foreground/80 text-sm leading-[1.2]">
              {link.description}
            </p>
          </div>
        </div>
        <ChevronRight className="stroke-muted-foreground size-3.5 opacity-100" />
      </div>
    </a>
  );
};

const MobileNavigationMenu = ({ open }: MobileNavigationMenuProps) => {
  return (
    <Sheet open={open}>
      <SheetContent
        aria-describedby={undefined}
        side="top"
        className="z-998 bg-background dark inset-0 h-dvh w-full pt-16 [&>button]:hidden"
      >
        <div className="flex-1 overflow-y-auto">
          <Container className="pb-12">
            <div className="mask-clip-border absolute -m-px h-px w-px overflow-hidden whitespace-nowrap text-nowrap border-0 p-0">
              <SheetTitle className="text-primary">
                Mobile Navigation
              </SheetTitle>
            </div>
            <div className="flex h-full flex-col justify-between gap-20">
              <Accordion type="multiple" className="w-full">
                {NAVIGATION.map((item, index) =>
                  renderMobileMenuItem(item, index),
                )}
              </Accordion>
              <div className="flex flex-col gap-3 pb-20">
                <Button variant="ghost" asChild className="w-full">
                  <a href={LOGIN_BUTTON.url}>{LOGIN_BUTTON.label}</a>
                </Button>
                <Button asChild className="w-full">
                  <a href={PRIMARY_BUTTON.url}>{PRIMARY_BUTTON.label}</a>
                </Button>
              </div>
            </div>
          </Container>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const renderMobileMenuItem = (item: MenuItem, index: number) => {
  if (item.links) {
    return (
      <AccordionItem key={item.title} value={`nav-${index}`}>
        <AccordionTrigger className="text-muted-foreground h-[3.75rem] items-center p-0 text-base font-normal leading-[3.75] hover:no-underline">
          {item.title}
        </AccordionTrigger>
        <AccordionContent>
          {item.links.map((subItem) => (
            <MenuSubLink key={subItem.label} link={subItem} />
          ))}
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <a
      key={item.title}
      href={item.url}
      className="text-muted-foreground ring-ring/10 outline-ring/50 nth-last-1:border-0 flex h-[3.75rem] items-center border-b p-0 text-left text-base font-normal leading-[3.75] transition-all focus-visible:outline-1 focus-visible:ring-4"
    >
      {item.title}
    </a>
  );
};


export { Navbar9 };
