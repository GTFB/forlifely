import type { Metadata } from "next";
import { Lato, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "../globals.css";
import { PROJECT_SETTINGS } from "@/settings";
import { ThemeProvider } from "next-themes";
import { CartProvider } from "@/contexts/CartContext";

const isStaticExport = process.env.STATIC_EXPORT === 'true';

let AbortErrorSuppressor: any;
let ScriptOptimizer: any;
let AccessibilityEnhancer: any;
let PerformanceMonitor: any;
let PwaLoader: any;

if (!isStaticExport) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  AbortErrorSuppressor = require("@/components/ui/abort-error-suppressor").AbortErrorSuppressor;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ScriptOptimizer = require("@/components/ui/script-optimizer").ScriptOptimizer;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  AccessibilityEnhancer = require("@/components/ui/accessibility-enhancer").AccessibilityEnhancer;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  PerformanceMonitor = require("@/components/ui/performance-monitor").PerformanceMonitor;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  PwaLoader = require("@/components/PwaLoader").default;
}

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  preload: true,
  fallback: ['system-ui', 'arial'],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin", "cyrillic"],
  preload: true,
  fallback: ['serif', 'Georgia'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://payde.com'),
  title: "NeuroPublisher - Marktplatz",
  description: "NeuroPublisher Marktplatz: Produkte, Dienstleistungen und mehr. Qualitätsprodukte und exzellenter Service.",
  keywords: [
    "neuropublisher",
    "marktplatz",
    "produkte",
    "dienstleistungen",
    "online shop",
    "e-commerce"
  ],
  openGraph: {
    type: "website",
    siteName: "NeuroPublisher",
    locale: "de_DE",
    url: "https://payde.com/de",
    title: "NeuroPublisher - Marktplatz",
    description: "NeuroPublisher Marktplatz: Produkte, Dienstleistungen und mehr. Qualitätsprodukte und exzellenter Service.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "NeuroPublisher",
      },
    ],
  },
  authors: [
    {
      name: "NeuroPublisher",
      url: "https://payde.com",
    },
  ],
  creator: "NeuroPublisher",
  icons: [
    {
      rel: "icon",
      url: "/images/favicon.png",
    },
  ],
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: "https://payde.com/de",
    languages: {
      'en': 'https://payde.com',
      'de': 'https://payde.com/de',
      'fr': 'https://payde.com/fr',
      'es': 'https://payde.com/es',
      'ru': 'https://payde.com/ua',
      'x-default': 'https://payde.com',
    },
  },
};

export default function GermanLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning className={PROJECT_SETTINGS.defaultTheme}>
      <head>
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#82181A" />
        <meta name="color-scheme" content="light dark" />
        <meta name="format-detection" content="telephone=no" />
      </head>

      <body className={`${lato.variable} ${playfairDisplay.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider attribute="data-theme" defaultTheme={PROJECT_SETTINGS.defaultTheme} enableSystem={false}>
          <CartProvider>
            {children}
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

