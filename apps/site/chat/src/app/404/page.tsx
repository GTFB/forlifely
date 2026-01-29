"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/Container";
import { MainLayout } from "@/components/layouts/main-layout";
import { Home, Search } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { t } from "@/lib/i18n";

export default function NotFound404() {
  const { locale, getLocalizedPath } = useLocale();
  
  return (
    <MainLayout>
      <div className="py-12 lg:py-16">
        <Container>
          <div className="flex flex-col items-center justify-center text-center min-h-[60vh]">
            <div className="mb-8">
              <h1 className="text-9xl font-bold text-muted-foreground/20 mb-4">404</h1>
              <h2 className="text-3xl font-bold mb-4">{t("common.pageNotFound", locale)}</h2>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                {t("common.pageNotFoundDescription", locale)}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link href={getLocalizedPath("/")}>
                <Button size="lg" className="w-full sm:w-auto">
                  <Home className="mr-2 h-4 w-4" />
                  {t("common.goToHome", locale)}
                </Button>
              </Link>
              <Link href={getLocalizedPath("/catalog")}>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <Search className="mr-2 h-4 w-4" />
                  {t("common.goToCatalog", locale)}
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </div>
    </MainLayout>
  );
}

