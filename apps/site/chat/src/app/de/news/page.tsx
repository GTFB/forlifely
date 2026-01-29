import { BlogList } from "@/components/blog/blog-list";
import { MainLayout } from "@/components/layouts/main-layout";

export default function NewsPage() {
  return (
    <MainLayout>
      <BlogList />
    </MainLayout>
  );
}

