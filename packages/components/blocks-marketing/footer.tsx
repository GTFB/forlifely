"use client";

import { motion, type Variants } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/misc/logo/logo";
import { PROJECT_SETTINGS } from "@/settings";
import { Container } from "@/components/blocks-marketing/Container";
import { useTranslations } from "@/hooks/use-translations";

// Page routes mapping
const pageRoutes: Record<string, string> = {
  home: '/',
  about_us: '/about',
  services: '/services',
  catalog: '/catalog',
  projects: '/projects',
  team: '/team',
  blog: '/blog',
  news: '/news',
  vendors: '/vendors',
  ads: '/ads',
  events: '/events',
  objects: '/objects',
  legal: '/legal',
  knowledge_base: '/knowledge-base',
  jobs: '/jobs',
  testimonials: '/testimonials',
  prices: '/prices',
  wholesale: '/wholesale',
  history: '/history',
  locations: '/locations',
  investors: '/investors',
  tenders: '/tenders',
  certificates: '/certificates',
  press: '/press',
  csr: '/csr',
  faq: '/faq',
  promotions: '/promotions',
  loyalty_program: '/loyalty-program',
  affiliate_program: '/affiliate-program',
  franchise: '/franchise',
  gallery: '/gallery',
  video: '/video',
  appointment: '/appointment',
  contacts: '/contact',
  search: '/search',
  cart: '/cart',
  checkout: '/checkout',
  compare: '/compare',
  wishlist: '/wishlist',
  sitemap: '/sitemap',
  sign_in: '/sign-in',
  sign_up: '/sign-up',
  email_confirmation: '/email-confirmation',
  password_recovery: '/password-recovery',
  under_construction: '/under-construction',
  coming_soon: '/coming-soon',
  system_status: '/system-status',
  unsubscribe: '/unsubscribe',
  thank_you: '/thank-you',
}

// Page groups configuration
const pageGroups = [
  {
    key: 'main',
    pages: [
      'home',
      'about_us', 
      'blog',
      'news',
      'knowledge_base',
      'team',
      'history',
      'locations',
      'investors',
      'tenders',
      'certificates',
      'press',
      'csr',
      'jobs',
      'vendors',
      'ads',
      'events',
      'objects',
      'appointment',
    ],
  },
  {
    key: 'Products',
    pages: [
      'services',
      'catalog',
      'projects',
      'prices',
      'wholesale',
      'promotions',
      'loyalty_program',
      'affiliate_program',
      'franchise',
      'testimonials',
      'gallery',
      'video',
      'cart',
      'checkout',
      'compare',
      'wishlist',
    ],
  },
  {
    key: 'Technical',
    pages: [

      'search',
      'sitemap',

      'sign_in',
      'sign_up',
      'email_confirmation',
      'password_recovery',
      'under_construction',
      'coming_soon',
      'system_status',
      'unsubscribe',
      'thank_you',
    ],
  },
];

// Social links
const SOCIAL_LINKS = [
  { label: "LinkedIn", href: "#" },
  { label: "Twitter", href: "#" },
  { label: "Facebook", href: "#" },
];

interface Footer31Props {
  className?: string;
}

const Footer31 = ({ className }: Footer31Props) => {
  const { t, translations } = useTranslations();
  const allRightsReserved = translations?.footer?.all_rights_reserved || 'All rights reserved';
  const getSupport = translations?.footer?.get_support || 'Get Support :';
  const newsletter = translations?.footer?.newsletter || 'Sign up for newsletter :';
  const placeholder = translations?.footer?.newsletter_placeholder || 'Name*';

  // Build page groups with translations
  const footerGroups = pageGroups.map((group) => {
    const groupTitle = translations?.footer?.groups?.[group.key] || group.key;
    const items = group.pages
      .map((pageKey) => {
        const title = translations?.pages?.[pageKey]?.title;
        const href = pageRoutes[pageKey];
        if (!title || !href) return null;
        return { label: title, href };
      })
      .filter((item): item is { label: string; href: string } => item !== null);

    return {
      title: groupTitle,
      items,
    };
  }).filter((group) => group.items.length > 0);

  // Build footer legal links
  const FOOTER_LINKS = ['legal', 'faq', 'contacts']
    .map((pageKey) => {
      const title = translations?.pages?.[pageKey]?.title;
      const href = pageRoutes[pageKey];
      if (!title || !href) return null;
      return { label: title, href };
    })
    .filter((item): item is { label: string; href: string } => item !== null);

  return (
    <section
      className={cn("dark bg-background py-32 text-foreground", className)}
    >
      <Container>
        <div className="flex flex-col gap-16">
          <div className="flex flex-col gap-10">
            <p className="relative text-4xl font-medium tracking-tight lg:text-5xl">
              {PROJECT_SETTINGS.description}
            </p>
          </div>
          <div className="grid w-full grid-cols-1 gap-12 text-sm font-light sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:text-base">
            {footerGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-4">
                <h3 className="text-base font-medium tracking-tight lg:text-lg">
                  {group.title}
                </h3>
                <ul className="space-y-1">
                  {group.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="tracking-tight text-foreground hover:text-foreground/30"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="space-y-4">
              <h3 className="text-base font-medium tracking-tight lg:text-lg">
                {translations?.footer?.groups?.social_networks || 'Social Networks'}
              </h3>
              <ul className="space-y-1">
                {SOCIAL_LINKS.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="group flex items-center gap-1 tracking-tight text-foreground hover:text-foreground/30"
                    >
                      {item.label}{" "}
                      <ArrowUpRight className="size-3.5 text-foreground group-hover:text-muted-foreground/50" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-20 flex flex-col justify-between gap-16 lg:flex-row">
          <div className="flex w-full max-w-md flex-col gap-10">
            <div className="space-y-1 text-sm font-light tracking-tight lg:text-base">
              <p>{newsletter}</p>
              <form className="flex w-full items-end border-b border-b-foreground/10">
                <Input
                  type="text"
                  placeholder={placeholder}
                  className="mt-10 rounded-none border-0 bg-transparent p-0 uppercase shadow-none placeholder:text-foreground/20 focus-visible:ring-0 lg:text-base"
                />
                <Button type="submit" variant="ghost">
                  <ArrowRight />
                </Button>
              </form>
            </div>
          </div>
          <div className="grid w-full max-w-xs grid-cols-2 gap-10 text-sm font-light lg:text-base">
            <div className="space-y-1">
              <p>{getSupport}</p>
              <a href="mailto:info@altrp.org" className="tracking-tight text-foreground hover:text-foreground/30">
                info@altrp.org
              </a>
              <p className="mt-4">
                {translations?.footer?.address || "Delaware, US"}
              </p>
            </div>
            <ul className="space-y-1">
              {FOOTER_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="group flex items-center gap-1 tracking-tight text-foreground hover:text-foreground/30"
                  >
                    {item.label}{" "}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-20 w-full lg:mt-32 flex justify-center items-start">
          <div className="w-full max-w-2xl">
            <CenteredLogo />
          </div>
        </div>
        <div className="mt-12 text-center text-sm font-light text-foreground/60">
          © {new Date().getFullYear()} {PROJECT_SETTINGS.name}, {allRightsReserved}
        </div>
      </Container>
    </section>
  );
};

export default Footer31;

const CenteredLogo = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const pathVariants: Variants = {
    hidden: {
      y: 60,
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <motion.svg
      width="271"
      height="107"
      viewBox="0 0 271 107"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="w-full h-auto max-w-5xl mx-auto scale-150"
    >
      <defs>
        <linearGradient id="fadeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="50%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id="fadeMask">
          <rect width="100%" height="100%" fill="url(#fadeGradient)" />
        </mask>
      </defs>
      <g mask="url(#fadeMask)">
        <motion.path
          d="M29.5491 85.6C40.5108 85.6 46.9449 79.6556 47.8981 77.3967H48.2556V84.4111H66.7237V22.5889H48.2556V29.6033H47.8981C46.9449 27.3444 40.5108 21.4 29.5491 21.4C15.4894 21.4 0 31.9811 0 53.5C0 75.0189 15.4894 85.6 29.5491 85.6ZM18.2299 53.5C18.2299 43.5133 25.498 37.8067 33.3619 37.8067C41.464 37.8067 48.7322 43.3944 48.7322 53.5C48.7322 63.6056 41.464 69.1933 33.3619 69.1933C25.498 69.1933 18.2299 63.4867 18.2299 53.5Z"
          variants={pathVariants}
          fill="white"
        />
        <motion.path
          d="M77.9126 84.4111H96.3808V0H77.9126V84.4111Z"
          variants={pathVariants}
          fill="white"
        />
        <motion.path
          d="M133.558 85.1244C137.848 85.1244 143.09 84.2922 145.473 81.9144V67.8856C143.209 68.5989 141.065 68.8367 139.635 68.8367C134.035 68.8367 132.248 65.5078 132.248 62.4167V37.2122H145.235V22.5889H132.248V6.77667H113.779V22.5889H104.605V37.2122H113.779V65.3889C113.779 79.5367 122.12 85.1244 133.558 85.1244Z"
          variants={pathVariants}
          fill="white"
        />
        <motion.path
          d="M154.01 84.4111H172.478V58.9689C172.478 47.3178 179.508 39.1144 191.78 39.1144C193.329 39.1144 194.64 39.2333 196.07 39.4711V21.9944C194.521 21.5189 193.091 21.4 191.661 21.4C180.461 21.4 174.504 29.3656 172.478 39.3522V22.5889H154.01V84.4111Z"
          variants={pathVariants}
          fill="white"
        />
        <motion.path
          d="M204.276 107H222.744V77.3967H223.102C224.055 79.6556 230.489 85.6 241.451 85.6C255.511 85.6 271 75.0189 271 53.5C271 31.9811 255.511 21.4 241.451 21.4C230.489 21.4 224.055 27.3444 223.102 29.6033H222.744V22.5889H204.276V107ZM222.268 53.5C222.268 43.3944 229.536 37.8067 237.638 37.8067C245.502 37.8067 252.77 43.5133 252.77 53.5C252.77 63.4867 245.502 69.1933 237.638 69.1933C229.536 69.1933 222.268 63.6056 222.268 53.5Z"
          variants={pathVariants}
          fill="white"
        />
      </g>
    </motion.svg>
  );
};