"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { fetchNews, type ParsedNewsArticle } from "@/lib/api/news";
import { Container } from "@/components/Container";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/hooks/use-locale";
import { t } from "@/lib/i18n";

type MultilingualContent = {
  en: string;
  de: string;
  es: string;
  fr: string;
  ru: string;
};

function parseMultilingual(content: string | MultilingualContent | null | undefined, locale: string): string {
  if (!content) return '';
  
  // If it's already a string, try to parse as JSON
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed[locale] || parsed.en || parsed.ru || '';
      }
      return parsed;
    } catch {
      // If parsing fails, return as is
      return content;
    }
  }
  
  // If it's already an object
  if (typeof content === 'object') {
    return content[locale as keyof MultilingualContent] || content.en || content.ru || '';
  }
  
  return '';
}

function formatDate(dateString: string | null | undefined, locale: string = 'en'): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '';
    }
    const localeString = locale === 'en' ? 'en-US' : locale === 'ru' ? 'ru-RU' : 'en-US';
    return new Intl.DateTimeFormat(localeString, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return '';
  }
}

export function BlogList() {
  const [articles, setArticles] = useState<ParsedNewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const { locale, getLocalizedPath } = useLocale();
  const currentLocale = locale || 'en';

  useEffect(() => {
    const loadArticles = async () => {
      setLoading(true);
      const result = await fetchNews(1, 20);

      if (result.success) {
        setArticles(result.data);
      }
      setLoading(false);
    };

    loadArticles();
  }, []);

  return (
    <div className="py-12 lg:py-16">
      <Container>
        {loading ? (
          <div className="flex flex-col items-center gap-8">
            <div className="text-center">
              <h1 className="mb-4 text-3xl font-bold md:text-4xl">
                {t("news.title", locale)}
              </h1>
              <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
                {t("news.loading", locale)}
              </p>
            </div>
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center gap-8">
            <div className="text-center">
              <h1 className="mb-4 text-3xl font-bold md:text-4xl">
                {t("news.title", locale)}
              </h1>
              <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
                {t("news.noNewsYet", locale)}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="text-center">
              <h1 className="mb-4 text-3xl font-bold md:text-4xl">
                {t("news.title", locale)}
              </h1>
              <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
                {t("news.description", locale)}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {articles.map((article) => {
                const title = parseMultilingual(article.title, currentLocale);
                const excerpt = parseMultilingual(article.excerpt, currentLocale);
                
                return (
                  <Link key={article.id} href={getLocalizedPath(`/news/${article.slug}`)}>
                    <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02] overflow-hidden cursor-pointer">
                      {article.image && (
                        <div className="relative w-full -mt-6 overflow-hidden">
                          <img
                            src={article.image}
                            alt={title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader className={article.image ? "pt-2" : ""}>
                        {article.category && (
                          <div className="text-muted-foreground text-xs uppercase tracking-wider mb-2">
                            {article.category}
                          </div>
                        )}
                        <CardTitle className="line-clamp-2">{title}</CardTitle>
                        {excerpt && (
                          <CardDescription className="line-clamp-2">
                            {excerpt}
                          </CardDescription>
                        )}
                        {article.createdAt && formatDate(article.createdAt, currentLocale) && (
                          <p className="text-xs text-muted-foreground mt-3">
                            {formatDate(article.createdAt, currentLocale)}
                          </p>
                        )}
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
