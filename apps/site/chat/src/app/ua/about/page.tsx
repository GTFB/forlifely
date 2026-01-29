"use client";

import { MainLayout } from "@/components/layouts/main-layout";
import { Container } from "@/components/Container";
import { Logo } from "@/packages/components/misc/logo/logo";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/hooks/use-locale";
import { t } from "@/lib/i18n";

export default function AboutPage() {
  const { locale } = useLocale();
  
  return (
    <MainLayout>
      <div className="py-12 lg:py-16">
        <Container>
          <div className="space-y-12">
            {/* Company Information Section */}
            <Card className="py-10">
              <CardContent className="px-10">
                <div className="flex md:flex-row flex-col gap-10">
                  <div className="space-y-6 flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-4">
                      <Logo className="[&_img]:max-h-24 [&_img]:w-auto" />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-lg text-muted-foreground font-medium">
                          {t("about.subtitle", locale)}
                        </p>
                        <p className="text-lg text-muted-foreground">
                          {t("about.description", locale)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Our Advantage Section */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">{t("about.title", locale)}</h2>
                <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                  <p>
                    {t("about.content1", locale)}
                  </p>
                  <p>
                    {t("about.content2", locale)}
                  </p>
                  <p>
                    {t("about.content3", locale)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </MainLayout>
  );
}

