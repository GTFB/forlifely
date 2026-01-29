"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { getRestaurantStatus } from "@/lib/restaurant-status";
import { cn } from "@/lib/utils";

interface RestaurantStatusBadgeProps {
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
  showIcon?: boolean;
}

export function RestaurantStatusBadge({
  variant = "secondary",
  className,
  showIcon = false,
}: RestaurantStatusBadgeProps) {
  const [status, setStatus] = useState(getRestaurantStatus());

  useEffect(() => {
    // Update status every minute
    const interval = setInterval(() => {
      setStatus(getRestaurantStatus());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <Badge
      variant="outline"
      className={cn(
        status.isOpen
          ? "bg-green-600 text-white border-none shadow"
          : "border shadow",
        className
      )}
      style={{
        backgroundColor: status.isOpen ? undefined : "transparent",
        color: status.isOpen ? undefined : "#503732",
        border: status.isOpen ? undefined : "1px solid #503732"
      }}
    >
      {status.statusText}
    </Badge>
  );
}

