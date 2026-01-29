"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fetchNews, fetchNewsBySlug, type ParsedNewsArticle } from "@/lib/api/news";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/Container";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/hooks/use-locale";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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

interface BlogPostProps {
  article: ParsedNewsArticle | null;
  loading?: boolean;
}

export function BlogPost({ article, loading }: BlogPostProps) {
  const { locale } = useLocale();
  const currentLocale = locale || 'en';
  const [relatedNews, setRelatedNews] = useState<ParsedNewsArticle[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  useEffect(() => {
    if (!article) return;

    const loadRelatedNews = async () => {
      try {
        setLoadingRelated(true);
        const response = await fetchNews(1, 5);
        if (response.success && Array.isArray(response.data)) {
          // Exclude current article and take first 4
          const filtered = response.data
            .filter(item => item.id !== article.id && item.slug !== article.slug)
            .slice(0, 4);
          setRelatedNews(filtered);
        }
      } catch (error) {
        console.error('Failed to load related news:', error);
      } finally {
        setLoadingRelated(false);
      }
    };

    loadRelatedNews();
  }, [article]);

  if (loading) {
    return (
      <div className="py-12 lg:py-16">
        <Container>
          <div className="mx-auto max-w-5xl">
            <p className="text-muted-foreground text-center">Loading...</p>
          </div>
        </Container>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="py-12 lg:py-16">
        <Container>
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <h1 className="mb-4 text-3xl font-bold">Article not found</h1>
              <p className="mb-8 text-muted-foreground">
                The requested article does not exist or has been removed.
              </p>
              <Link href="/news">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to News
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  const title = parseMultilingual(article.title, currentLocale);
  const content = parseMultilingual(article.content, currentLocale);
  const excerpt = parseMultilingual(article.excerpt, currentLocale);

  return (
    <div className="py-12 lg:py-16">
      <Container>
        <div className="space-y-8">
          <div className="flex justify-between items-center mb-8">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/news">News</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="max-w-[150px] md:max-w-none truncate md:truncate-none">{title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Link href="/news">
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to News
              </Button>
            </Link>
          </div>
        </div>
      </Container>
      
      {/* Hero block with image - container width */}
      {article.image && article.image !== '/images/block/placeholder-dark-1.svg' ? (
        <Container>
          <div className="mb-8 w-full">
            <div className="relative aspect-[21/9] w-full overflow-hidden rounded-lg">
              <img
                src={article.image}
                alt={title}
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay - darker at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
              {/* Content overlay */}
              <div className="absolute inset-0 flex flex-col justify-end items-center p-6 md:p-12 lg:p-16">
                <div className="flex flex-col items-center gap-3 md:gap-4 text-center max-w-4xl">
                  {article.category && (
                    <div className="text-white text-sm uppercase tracking-wider font-medium">
                      {article.category}
                    </div>
                  )}
                  <h1 className="text-white text-2xl font-semibold md:text-3xl lg:text-4xl xl:text-5xl leading-tight drop-shadow-lg">
                    {title}
                  </h1>
                  <div className="flex items-center gap-3 text-sm text-white md:text-base">
                    <span className="drop-shadow-md">
                      {formatDate(article.createdAt, currentLocale) || 'Date not specified'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      ) : (
        <Container>
          <div className="flex flex-col items-center gap-4 text-center mb-8">
            {article.category && (
              <div className="text-muted-foreground text-sm uppercase tracking-wider">
                {article.category}
              </div>
            )}
            <h1 className="max-w-3xl text-pretty text-4xl font-semibold md:text-5xl lg:text-6xl">
              {title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground md:text-base">
              <span>
                {formatDate(article.createdAt, currentLocale) || 'Date not specified'}
              </span>
            </div>
          </div>
        </Container>
      )}
      
      <Container>
        <div className="prose prose-lg dark:prose-invert mx-auto max-w-3xl">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: () => null, // Hide h1 in content since we already have it in hero block
              h2: ({ children }) => (
                <h2 className="text-2xl font-bold mb-3 mt-6">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-semibold mb-2 mt-4">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="mb-4 leading-relaxed">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="ml-4">{children}</li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic">{children}</em>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary pl-4 italic my-4">
                  {children}
                </blockquote>
              ),
              code: ({ children, className }) => {
                const isInline = !className;
                return isInline ? (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                    {children}
                  </code>
                ) : (
                  <code className={className}>{children}</code>
                );
              },
              pre: ({ children }) => (
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
                  {children}
                </pre>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-primary hover:underline"
                  target={href?.startsWith('http') ? '_blank' : undefined}
                  rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  {children}
                </a>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        {relatedNews.length > 0 && (
          <div className="mt-16 pt-16 border-t">
            <h2 className="mb-8 text-2xl font-bold text-center sm:text-3xl">
              Related News
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedNews.map((relatedArticle) => {
                const relatedTitle = parseMultilingual(relatedArticle.title, currentLocale);
                const relatedExcerpt = parseMultilingual(relatedArticle.excerpt, currentLocale);
                
                return (
                  <Link key={relatedArticle.id} href={`/news/${relatedArticle.slug}`}>
                    <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02] overflow-hidden cursor-pointer">
                      {relatedArticle.image && (
                        <div className="relative w-full -mt-6 overflow-hidden">
                          <img
                            src={relatedArticle.image}
                            alt={relatedTitle}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader className={relatedArticle.image ? "pt-2" : ""}>
                        {relatedArticle.category && (
                          <div className="text-muted-foreground text-xs uppercase tracking-wider mb-2">
                            {relatedArticle.category}
                          </div>
                        )}
                        <CardTitle className="line-clamp-2">{relatedTitle}</CardTitle>
                        {relatedExcerpt && (
                          <CardDescription className="line-clamp-2">
                            {relatedExcerpt}
                          </CardDescription>
                        )}
                        {relatedArticle.createdAt && formatDate(relatedArticle.createdAt, currentLocale) && (
                          <p className="text-xs text-muted-foreground mt-3">
                            {formatDate(relatedArticle.createdAt, currentLocale)}
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
