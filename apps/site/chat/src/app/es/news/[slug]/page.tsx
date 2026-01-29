import { NewsArticlePageClient } from "./page-client";

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Pass slug to client component, which will fetch data via API
  // This approach is more reliable and works with both SSR and client-side navigation
  return <NewsArticlePageClient slug={slug} article={null} />;
}
