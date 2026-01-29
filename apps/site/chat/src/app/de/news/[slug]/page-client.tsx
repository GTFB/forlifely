"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BlogPost } from "@/components/blog/blog-post";
import { MainLayout } from "@/components/layouts/main-layout";
import { fetchNewsBySlug, type ParsedNewsArticle } from "@/lib/api/news";


export function NewsArticlePageClient({
  slug,
  article: initialArticle = null,
}: {
  slug: string;
  article?: ParsedNewsArticle | null;
}) {
  const [article, setArticle] = useState<ParsedNewsArticle | null>(initialArticle);
  const [loading, setLoading] = useState(!article);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    if (article) {
      return;
    }

    const loadArticle = async () => {
      try {
        setLoading(true);
        const result = await fetchNewsBySlug(slug);
        console.log('result', result);
        if (result.success && result.data) {
          setArticle(result.data);
        } else {
          setArticle(null);
        }
      } catch (error) {
        console.error('Error loading article:', error);
        setArticle(null);
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [slug]);

  return (
    <MainLayout>
      <BlogPost article={article} loading={loading} />
    </MainLayout>
  );
}

