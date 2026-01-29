"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/use-locale";

const COOKIE_CONSENT_KEY = "cookie-consent";

const translations = {
  en: {
    title: "We use cookies",
    description: "We use cookies to improve website performance, personalize content, and analyze traffic. By continuing to use our website, you agree to the use of cookies.",
    accept: "Accept",
    learnMore: "Learn more",
    close: "Close",
  },
  de: {
    title: "Wir verwenden Cookies",
    description: "Wir verwenden Cookies, um die Website-Leistung zu verbessern, Inhalte zu personalisieren und den Datenverkehr zu analysieren. Durch die weitere Nutzung unserer Website stimmen Sie der Verwendung von Cookies zu.",
    accept: "Akzeptieren",
    learnMore: "Mehr erfahren",
    close: "Schließen",
  },
  fr: {
    title: "Nous utilisons des cookies",
    description: "Nous utilisons des cookies pour améliorer les performances du site web, personnaliser le contenu et analyser le trafic. En continuant à utiliser notre site web, vous acceptez l'utilisation de cookies.",
    accept: "Accepter",
    learnMore: "En savoir plus",
    close: "Fermer",
  },
  es: {
    title: "Utilizamos cookies",
    description: "Utilizamos cookies para mejorar el rendimiento del sitio web, personalizar el contenido y analizar el tráfico. Al continuar utilizando nuestro sitio web, acepta el uso de cookies.",
    accept: "Aceptar",
    learnMore: "Más información",
    close: "Cerrar",
  },
  ua: {
    title: "Мы используем cookie",
    description: "Мы используем файлы cookie для улучшения работы сайта, персонализации контента и анализа трафика. Продолжая использовать наш сайт, вы соглашаетесь с использованием cookie.",
    accept: "Принять",
    learnMore: "Подробнее",
    close: "Закрыть",
  },
} as const;

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const { locale, getLocalizedPath } = useLocale();

  useEffect(() => {
    // Check if consent was already given
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Show after a small delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  const t = translations[locale] || translations.en;
  const cookieNoticePath = getLocalizedPath("/legal/cookie-notice");

  return (
    <Card
      className={cn(
        "fixed bottom-4 left-4 z-50 w-full max-w-md shadow-lg transition-all duration-300",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2 pointer-events-none"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Cookie className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-sm mb-1">{t.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t.description}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={handleAccept}
                size="sm"
                className="text-xs"
              >
                {t.accept}
              </Button>
              <Link href={cookieNoticePath}>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {t.learnMore}
                </Button>
              </Link>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mt-1 -mr-1"
            onClick={handleAccept}
            aria-label={t.close}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

