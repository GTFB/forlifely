"use client";

import { PROJECT_SETTINGS } from "@/settings";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useTheme } from "@/packages/hooks/use-theme";

interface LogoProps {
  className?: string
  collapsed?: boolean
  size?: "small" | "large"
}

export function Logo({ className }: LogoProps) {
  const { theme } = useTheme();
  // Extract height class if present
  const hasHeight = className?.match(/h-[\d]+/);
  
  const logoSrc = theme === "dark" ? "/images/logo_dark.svg" : "/images/logo.svg";
  
  // Check if justify class is provided in className
  const hasJustify = className?.match(/justify-(start|end|center|between|around|evenly)/);
  
  return (
    <div className={cn(
      "flex items-center",
      hasJustify ? "" : "justify-center",
      className
    )}>
      <Image 
        src={logoSrc}
        alt="Sun Day Logo" 
        width={90} 
        height={32}
        priority
        className={cn(
          "object-contain",
          hasHeight ? "h-full w-auto" : "w-full h-auto"
        )}
      />
    </div>
  );
}
