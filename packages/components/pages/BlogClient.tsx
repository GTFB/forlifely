"use client";

import { HeroHeader } from "@/components/blocks-marketing/header";
import FooterSection from "@/components/blocks-marketing/footer";
import { Container } from "@/components/blocks-marketing/Container";
import { PostCard } from "@/components/blocks-app/blog/PostCard/PostCard";
import { type Post } from "@/packages/types/post";

interface BlogClientProps {
  title: string;
  description?: string;
  blogPosts: Post[];
}

export function BlogClient({ title, description, blogPosts }: BlogClientProps) {
  return (
    <div className="flex-1">
      <HeroHeader />
      <section className="pt-24 py-16 md:py-32">
        <Container>
          <h1 className="text-4xl md:text-5xl font-medium mb-8">{title}</h1>
          {description && (
            <p className="text-lg text-muted-foreground mb-8">{description}</p>
          )}
          {blogPosts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {blogPosts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <div className="prose prose-lg max-w-none">
              <p>Content coming soon...</p>
            </div>
          )}
        </Container>
      </section>
      <FooterSection />
    </div>
  );
}
