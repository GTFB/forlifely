import BlogPostPageClient from './page.client'

export const dynamicParams = false

const blogPosts: Record<
  string,
  {
    title: string;
    category: string;
    author: string;
    date: string;
    readTime: string;
  }
> = {
  "kak-oformit-rassrochku": {
    title: "Как оформить рассрочку",
    category: "Финансы",
    author: "Иван Иванов",
    date: "2025-11-15",
    readTime: "5 мин",
  },
  "preimushchestva-rassrochki": {
    title: "Преимущества рассрочки",
    category: "Финансы",
    author: "Мария Петрова",
    date: "2025-11-10",
    readTime: "4 мин",
  },
};

export async function generateStaticParams() {
  // Return all blog post slugs for static generation
  return Object.keys(blogPosts).map((slug) => ({ slug }))
}

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = blogPosts[slug]
  
  if (!post) {
    return null
  }
  
  return <BlogPostPageClient slug={slug} post={post} />
}
