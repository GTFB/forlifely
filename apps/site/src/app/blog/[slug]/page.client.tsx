"use client";

import * as React from "react";
import { HeroHeader } from "@/components/home/header";
import FooterSection from "@/components/marketing-blocks/footer";
import { Button } from "@/components/ui/button";
import { Facebook, Twitter, Linkedin, Copy, Check } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { EsnadText } from "@/shared/types/esnad";

type BlogPostPageClientProps = {
  slug: string;
  post: EsnadText;
};

export default function BlogPostPageClient({ slug, post }: BlogPostPageClientProps) {
  const pathname = usePathname();

  const [copied, setCopied] = React.useState(false);

  const currentUrl = typeof window !== "undefined" ? window.location.origin + pathname : "";
  const content = post.content;

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!content) {
    return (
      <div className="flex-1 flex items-center justify-center py-16">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Статья не найдена</h1>
          <Link href="/blog">
            <Button variant="outline">Вернуться к блогу</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="flex-1">
      <HeroHeader />
      <article className="max-w-3xl mx-auto pt-24 py-16 px-6">
        <div className="mb-8">
          <Link href="/blog">
            <Button variant="ghost" size="sm">
              ← Назад к блогу
            </Button>
          </Link>
        </div>

        <header className="mb-8">
          <div className="mb-4">
            <span className="text-sm text-muted-foreground">{post.category}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{post.dataIn?.author}</span>
            <span>•</span>
            <span>{formatDate(post.dataIn?.date || post.createdAt)}</span>
            <span>•</span>
            <span>{post.dataIn?.readTime} минут на чтение</span>
          </div>
        </header>

        <div className="mb-12" dangerouslySetInnerHTML={{ __html: content }} />

        <div className="border-t pt-8">
          <h3 className="text-lg font-semibold mb-4">Поделиться</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  currentUrl
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                  currentUrl
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="h-4 w-4 mr-2" />
                LinkedIn
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Скопировано
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Копировать ссылку
                </>
              )}
            </Button>
          </div>
        </div>
      </article>
      <FooterSection />
    </div>
  );
}

