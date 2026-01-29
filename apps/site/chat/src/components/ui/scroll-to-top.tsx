"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling 300px
      const scrollThreshold = 300;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      setIsVisible(scrollTop > scrollThreshold);
    };

    // Check on mount
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      className={cn(
        "fixed bottom-[20px] right-[20px] z-50 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2 pointer-events-none"
      )}
      aria-label="Наверх"
    >
      <ArrowUp className="h-4 w-4" />
    </Button>
  );
}

