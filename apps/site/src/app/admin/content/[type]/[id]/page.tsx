import AdminContentEditPageClient from './page.client'

export async function generateStaticParams() {
  // Return empty array for dynamic admin pages that don't need static generation
  // These pages will be handled via client-side navigation
  return []
}

type PageProps = {
  params: Promise<{ type: string; id: string }>
}

export default async function AdminContentEditPage({ params }: PageProps) {
  await params
  return <AdminContentEditPageClient />
}
