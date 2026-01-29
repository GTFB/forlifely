"use client";

import { PROJECT_SETTINGS } from "@/settings";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import ThemeProvider only on client side to avoid SSR issues
const ThemeProvider = dynamic(
  () => import("next-themes").then((mod) => mod.ThemeProvider),
  { ssr: false }
);

export function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR (including static export), skip ThemeProvider to avoid context issues
  // ThemeProvider uses useContext which doesn't work during static generation
  // Only use ThemeProvider on the client side after hydration
  if (!mounted) {
    // During SSR, render children without ThemeProvider
    // The theme will be applied via the script in layout.tsx
    return <>{children}</>;
  }

  // On client side after hydration, use ThemeProvider
  return (
    <ThemeProvider attribute="data-theme" defaultTheme={PROJECT_SETTINGS.defaultTheme} enableSystem={false}>
      {children}
    </ThemeProvider>
  );
}

