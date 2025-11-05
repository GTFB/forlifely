import React from 'react'

// Server layout that exports generateStaticParams for static export
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

