"use client";

import { usePathname } from "next/navigation";
import { AppLayoutWithNav, type NavLabels, type BannerLabels } from "@/components/AppLayoutWithNav";

const AUTH_PATHS = ["/sign-in", "/sign-up"];

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((p) => pathname.includes(p));
}

export function PublicLayoutSwitcher({
  children,
  navLabels,
  bannerLabels,
}: {
  children: React.ReactNode;
  navLabels?: NavLabels;
  bannerLabels?: BannerLabels;
}) {
  const pathname = usePathname() ?? "";

  if (isAuthPath(pathname)) {
    return (
      <div className="min-h-screen bg-muted">
        {children}
      </div>
    );
  }

  return (
    <AppLayoutWithNav navLabels={navLabels} bannerLabels={bannerLabels}>
      {children}
    </AppLayoutWithNav>
  );
}
