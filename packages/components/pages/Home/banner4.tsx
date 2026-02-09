"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { Container } from "@/components/misc/layout/container";
import { Button } from "@/components/ui/button";

const BANNER_DISMISSED_KEY = "banner4-dismissed";

interface Banner4Props {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  defaultVisible?: boolean;
  className?: string;
}

const Banner4 = ({
  title = "We are celebrating our launch!",
  description = "Get on our invite list and find the support you need.",
  defaultVisible = true,
  className,
}: Banner4Props) => {
  const [isVisible, setIsVisible] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = sessionStorage.getItem(BANNER_DISMISSED_KEY) === "true";
    setIsVisible(dismissed ? false : defaultVisible);
  }, [defaultVisible]);

  const handleClose = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(BANNER_DISMISSED_KEY, "true");
    }
    setIsVisible(false);
  };

  if (isVisible === null || !isVisible) return null;

  return (
    <section className={cn("w-full bg-primary p-4", className)}>
      <Container>
        <div className="relative flex flex-col gap-4 text-center md:flex-row md:items-center md:justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-0 right-0 h-8 w-8 md:hidden"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="flex flex-col items-center gap-3 pt-2 text-primary-foreground md:flex-row md:items-center md:pt-0">
            <div className="flex flex-col gap-1 md:flex-row md:items-center">
              <p className="text-sm font-medium">{title}</p>
              <p className="text-sm text-primary-foreground/80">
                {description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hidden h-8 w-8 invert md:inline-flex"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
};

export { Banner4 };
