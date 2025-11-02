import { PROJECT_SETTINGS } from "@/settings";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  // Extract height class if present
  const hasHeight = className?.match(/h-[\d]+/);
  
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Image 
        src="/images/logo.svg" 
        alt="Sun Day Logo" 
        width={90} 
        height={32}
        className={cn(
          "object-contain",
          hasHeight ? "h-full w-auto" : "w-full h-auto"
        )}
      />
    </div>
  );
}
