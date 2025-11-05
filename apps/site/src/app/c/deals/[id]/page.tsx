// Server component wrapper that exports generateStaticParams
// This allows the client page component to work with static export
import DealDetailPageClient from './page.client'

export async function generateStaticParams() {
  // Return empty array to allow dynamic generation at runtime
  // In production, you could fetch all deal IDs here for static generation
  return []
}

export default DealDetailPageClient
