import DealDetailPageClient from './page.client'

export async function generateStaticParams() {
  return [{ id: 'placeholder' }]
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function AdminDealDetailPage({ params }: PageProps) {
  await params
  return <DealDetailPageClient />
}

