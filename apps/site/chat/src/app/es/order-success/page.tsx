"use client";

import { MainLayout } from "@/components/layouts/main-layout";
import { Container } from "@/components/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/hooks/use-locale";
import { t } from "@/lib/i18n";

export default function OrderSuccessPage() {
  const { locale, getLocalizedPath } = useLocale();
  
  return (
    <MainLayout>
      <section className="py-12 lg:py-16">
        <Container>
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md">
              <CardContent className="p-8 sm:p-12 flex flex-col items-center text-center gap-6">
                <div className="flex items-center justify-center size-16 sm:size-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-2">
                  <CheckCircle2 className="size-10 sm:size-12 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                    {t("orderSuccess.orderAccepted", locale)}
                  </h1>
                  <p className="text-lg text-foreground">
                    {t("orderSuccess.contactSoon", locale)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("orderSuccess.managerContact", locale)}
                  </p>
                </div>
                <Link href={getLocalizedPath("/")} className="w-full mt-4">
                  <Button 
                    size="lg" 
                    className="w-full text-lg px-8 py-6 rounded-2xl"
                  >
                    {t("orderSuccess.backToHome", locale)}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </MainLayout>
  );
}

