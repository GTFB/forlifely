
import * as React from "react";
import { TextsRepository } from "@/shared/repositories/texts.repository";
import { TaxonomyRepository } from "@/shared/repositories/taxonomy.repository";
import BlogPageComponent from "@/components/admin/pages/BlogPageComponent";

export default async function BlogPage() {
  const textsRepository = TextsRepository.getInstance();
  const taxonomyRepository = TaxonomyRepository.getInstance();
  const blogPosts = await textsRepository.findPublishedByType("BLOG");
  const categories = await taxonomyRepository.getTaxonomies({
    filters: {
      conditions: [
        { field: "entity", operator: "eq", values: ["blog.category"] },
      ],
    },
  });

  return <BlogPageComponent blogPosts={blogPosts} categories={categories.docs.map((category) => category.name).filter(Boolean)} />;
}

