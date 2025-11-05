import DealDetailPageClient from './page.client'

export async function generateStaticParams() {
  // Return at least one param for static export
  // In production, fetch actual deal IDs here
  return [{ id: 'placeholder' }]
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function DealDetailPage({ params }: PageProps) {
  await params
  return <DealDetailPageClient />
}
