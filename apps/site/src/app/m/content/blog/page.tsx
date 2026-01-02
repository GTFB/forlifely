import { Metadata } from "next"
import AdminBlogPageClient from "./page.client"
export const metadata: Metadata = {
  title: 'Блог - Статьи::Esnad Finance',
  description: 'Блог - Статьи::Esnad Finance',
}
export default function BlogPage() {
  return <AdminBlogPageClient />
}