import DealDetailPageClient from './page.client'
import { DealsRepository } from '@/shared/repositories/deals.repository'

export default async function AdminDealDetailPage({
  searchParams,
}: {
  searchParams: Promise<{ uuid?: string }>
}) {
  const params = await searchParams
  const uuid = params?.uuid

  if (uuid) {
    const dealsRepository = DealsRepository.getInstance()
    await dealsRepository.markAsViewed(uuid)
  }

  return <DealDetailPageClient />
}
