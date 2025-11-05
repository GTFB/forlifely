import React from 'react'

// Layout for dynamic deal detail page
// This exports generateStaticParams for static export compatibility
export async function generateStaticParams() {
  // Return empty array to allow dynamic generation at runtime
  // In production, you could fetch all deal IDs here for static generation
  return []
}

export default function DealDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

