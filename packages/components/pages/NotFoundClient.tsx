"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function NotFoundClient() {
  return (
    <div className="flex-1">
      <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
        <div className="text-center max-w-md">
          <h1 className="text-6xl md:text-8xl font-bold mb-4">404</h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">
            Страница не найдена
          </h2>
          <p className="text-muted-foreground mb-8">
            К сожалению, запрашиваемая страница не существует или была перемещена.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/">На главную</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/blog">Блог</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

