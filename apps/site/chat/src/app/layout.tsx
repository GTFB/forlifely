import type { Metadata } from "next";
import { Lato, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { PROJECT_SETTINGS } from "@/settings";
import { ThemeProvider } from "next-themes";
import { CartProvider } from "@/contexts/CartContext";
import { SocketUrlProvider } from "@/providers/SocketUrlProvider";
import { Toaster } from "@/components/ui/toaster";
// During static export, skip ThemeProviderWrapper and other client components to avoid context issues
const isStaticExport = process.env.STATIC_EXPORT === 'true';

// Conditionally import client components only when not in static export
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
  title: "NeuroPublisher - Marketplace",
  description: "NeuroPublisher marketplace: products, services, and more. Quality products and excellent service.",
  keywords: [
    "neuropublisher",
    "marketplace",
    "products",
    "services",
    "online store",
    "e-commerce"
  ],
  openGraph: {
    type: "website",
    siteName: "NeuroPublisher",
    locale: "en_US",
    url: "https://payde.com",
    title: "NeuroPublisher - Marketplace",
    description: "NeuroPublisher marketplace: products, services, and more. Quality products and excellent service.",

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
    canonical: "https://payde.com",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={PROJECT_SETTINGS.defaultTheme}>
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
        <SocketUrlProvider socketUrl={process.env.NEXT_PUBLIC_SOCKET_URL}>
          <ThemeProvider attribute="data-theme" defaultTheme={PROJECT_SETTINGS.defaultTheme} enableSystem={false}>
            <CartProvider>
              {children}
              <Toaster />
            </CartProvider>
          </ThemeProvider>
        </SocketUrlProvider>
      </body>
    </html>
  );
}
