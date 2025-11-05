import DealDetailPageClient from './page.client'

// For static export, generateStaticParams must be exported from page.tsx
// Return empty array to allow dynamic generation at runtime
export async function generateStaticParams() {
  // In production, you could fetch all deal IDs here for static generation
  return []
}

export default DealDetailPageClient
