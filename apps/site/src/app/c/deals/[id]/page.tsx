import { Metadata } from 'next'
import DealDetailPageClient from './page.client'

export async function generateStaticParams() {
  // Return at least one param for static export
  // In production, fetch actual deal IDs here
  return [{ id: 'placeholder' }]
}

type PageProps = {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: 'Детали заявки::Esnad Finance',
  description: 'Детали заявки::Esnad Finance',
}
export default async function DealDetailPage({ params }: PageProps) {
  await params
  return <DealDetailPageClient />
}
