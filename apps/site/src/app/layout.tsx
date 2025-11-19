import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { PROJECT_SETTINGS } from "@/settings";
import PwaLoader from "@/components/PwaLoader";
import { MeProvider } from "@/providers/MeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: true,
  fallback: ['system-ui', 'arial'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://esnad.ru'),
  title: "Esnad Finance",
  description: "Financial Solutions and Investment Platform",
  keywords: [
    "finance",
    "financial services",
    "investment",
    "financial solutions",
    "financial planning",
    "wealth management",
    "financial consulting",
    "asset management",
    "financial platform",
    "investment platform"
  ],
  openGraph: {
    type: "website",
    siteName: "Esnad Finance",
    locale: "ru_RU",
    url: "https://esnad.ru",
    title: "Esnad Finance - Financial Solutions and Investment Platform",
    description: "Financial Solutions and Investment Platform",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Esnad Finance",
      },
    ],
  },
  authors: [
    {
      name: "Esnad Finance",
      url: "https://esnad.ru",
    },
  ],
  creator: "Esnad Finance",
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
        <PwaLoader />
        <MeProvider refetchInterval={6000000} refetchOnFocus={true}>

          <ThemeProvider attribute="class" defaultTheme={PROJECT_SETTINGS.defaultTheme} enableSystem={false}>
            {children}
          </ThemeProvider>
        </MeProvider>
      </body>
    </html>
  );
}
