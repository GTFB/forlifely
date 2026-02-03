import { promises as fs } from "fs";
import path from "path";
import matter from "gray-matter";
// @ts-ignore - js-yaml types may not be properly resolved
import * as yaml from "js-yaml";
import { PROJECT_SETTINGS } from "@/settings";
import { frontmatterSchema } from "@/packages/lib/validators/content.schema";
import type { Post } from "@/packages/types/post";

function getBlogContentDir(): string {
  // process.cwd() returns the directory where Next.js is running (apps/site)
  // We need to go up to project root, then to packages/content/mdxs/blog
  const projectRoot = process.cwd(); // apps/site
  return path.resolve(projectRoot, "../../packages/content/mdxs/blog");
}

async function getBlogPosts(
  locale: string = PROJECT_SETTINGS.defaultLanguage
): Promise<Post[]> {
  const contentDir = getBlogContentDir();
  const posts: Post[] = [];

  try {
    const entries = await fs.readdir(contentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const slug = entry.name;
        let fileName = "index.mdx";

        // Try to find locale-specific file first
        if (locale !== PROJECT_SETTINGS.defaultLanguage) {
          const localeFile = path.join(contentDir, slug, `${locale}.mdx`);
          try {
            await fs.access(localeFile);
            fileName = `${locale}.mdx`;
          } catch {
            // Fallback to index.mdx if locale file doesn't exist
            fileName = "index.mdx";
          }
        }

        const filePath = path.join(contentDir, slug, fileName);
        try {
          const raw = await fs.readFile(filePath, "utf8");
          const { data, content } = matter(raw, {
            engines: {
              yaml: {
                parse: (str: string) => yaml.load(str) as any,
                stringify: (obj: any) => yaml.dump(obj),
              },
            },
          });

          const processed = {
            ...data,
            date:
              data.date instanceof Date
                ? data.date.toISOString()
                : data.date || undefined,
          };

          const validated = frontmatterSchema.parse(processed);

          posts.push({
            slug,
            title: validated.title,
            description: validated.description,
            date: validated.date,
            tags: validated.tags,
            excerpt: validated.excerpt,
            content: content.trim(),
            category: (data as any).category,
            author: (data as any).author,
            media: validated.media,
            seoTitle: (data as any).seoTitle,
            seoDescription: (data as any).seoDescription,
            seoKeywords: (data as any).seoKeywords,
          });
        } catch (error) {
          // Skip files that can't be parsed
          console.error(`Error reading post ${slug}:`, error);
        }
      }
    }

    // Sort by date (newest first) if date is available
    posts.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return posts;
  } catch (error) {
    console.error("Error reading blog directory:", error);
    return [];
  }
}

export async function getContent(
  type: string,
  locale: string = PROJECT_SETTINGS.defaultLanguage,
  options = {}
): Promise<Post[]> {
  switch (type) {
    case "blog":
      return getBlogPosts(locale);
    default:
      return [];
  }
}