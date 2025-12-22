import { TextsRepository } from '@/shared/repositories/texts.repository';
import BlogPostPageClient from './page.client'
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const textsRepository = TextsRepository.getInstance();
  const post = await textsRepository.findBySlug(slug);
  
  if (!post) {
    return {
      title: 'Статья не найдена',
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || 'https://esnad.finance'
  const url = `${siteUrl}/blog/${slug}`
  const title = post.title || 'Статья блога'
  const description = post.content 
    ? post.content.replace(/<[^>]*>/g, '').substring(0, 160).trim() + '...'
    : 'Читайте статью в блоге Esnad Finance'
  const author = post.dataIn?.author || 'Esnad Finance'
  const publishedTime = post.dataIn?.date || post.createdAt

  return {
    title: `${title} | Esnad Finance`,
    description,
    authors: [{ name: author }],
    openGraph: {
      title,
      description,
      url,
      siteName: 'Esnad Finance',
      locale: 'ru_RU',
      type: 'article',
      publishedTime,
      authors: [author],
      tags: post.category ? [post.category] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@esnadfinance',
    },
    alternates: {
      canonical: url,
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const textsRepository = TextsRepository.getInstance();
  const post = await textsRepository.findBySlug(slug);

  if (!post) {
    return notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || 'https://esnad.finance'
  const url = `${siteUrl}/blog/${slug}`
  
  return <BlogPostPageClient slug={slug} post={post} url={url} />
}
