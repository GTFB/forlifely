'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminContentPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to blog page by default
    router.replace('/admin/content/blog')
  }, [router])

  return null
}

