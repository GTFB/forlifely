import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { PROJECT_SETTINGS } from "@/settings";
import { ScriptOptimizer } from "@/components/ui/script-optimizer";
import { AccessibilityEnhancer } from "@/components/ui/accessibility-enhancer";
import { PerformanceMonitor } from "@/components/ui/performance-monitor";
import { PageTransition } from "@/components/ui/page-transition";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: true,
  fallback: ['system-ui', 'arial'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://altrp.org'),
  title: PROJECT_SETTINGS.name,
  description: PROJECT_SETTINGS.description,
  keywords: [
    "SMB platform",
    "digital foundation",
    "headless CMS",
    "e-commerce",
    "CRM",
    "LMS",
    "AI agents",
    "API-first",
    "business automation",
    "no-code",
    "low-code",
  ],
  openGraph: {
    type: "website",
    siteName: PROJECT_SETTINGS.name,
    locale: "ru_RU",
    url: "https://altrp.org",
    title: `${PROJECT_SETTINGS.name} — ${PROJECT_SETTINGS.description}`,
    description: PROJECT_SETTINGS.description,
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: PROJECT_SETTINGS.name,
      },
    ],
  },
  authors: [
    {
      name: PROJECT_SETTINGS.name,
      url: "https://altrp.org",
    },
  ],
  creator: PROJECT_SETTINGS.name,
  icons: [
    {
      rel: "icon",
      url: "/images/favicon.jpg",
    },
  ],
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning className={PROJECT_SETTINGS.defaultTheme === 'light' ? 'light' : 'dark'}>
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

      <body className={`${geistSans.variable} antialiased`} suppressHydrationWarning>
        <ScriptOptimizer />
        <AccessibilityEnhancer />
        <PerformanceMonitor />
        <ThemeProvider attribute="class" defaultTheme={PROJECT_SETTINGS.defaultTheme} enableSystem={false}>
            {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
