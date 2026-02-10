"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AppLayoutWithNav } from "@/components/AppLayoutWithNav";
import { SiteLocaleProvider } from "@/contexts/LocaleContext";

const DEFAULT_NAV_LABELS = {
  home: "Home",
  members: "Feel supported with Lifely",
  mentors: "Lifely for Mentors",
  meetLifely: "Meet Lifely",
};

const DEFAULT_BANNER_LABELS = {
  title: "We are celebrating our launch!",
  description: "Get on our invite list and find the support you need.",
};

export function NotFoundClient() {
  return (
    <SiteLocaleProvider locale="en">
      <AppLayoutWithNav navLabels={DEFAULT_NAV_LABELS} bannerLabels={DEFAULT_BANNER_LABELS}>
        <div className="flex-1">
          <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24">
            <div className="max-w-md text-center">
              <h1 className="mb-4 text-6xl font-bold md:text-8xl">404</h1>
              <h2 className="mb-4 text-2xl font-semibold md:text-3xl">
                Page not found
              </h2>
              <p className="mb-8 text-muted-foreground">
                The page you are looking for does not exist or has been moved.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/">Home</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/blog">Blog</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AppLayoutWithNav>
    </SiteLocaleProvider>
  );
}

