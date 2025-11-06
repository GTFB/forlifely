'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import PartnerAuthGuard from '@/components/cabinet/PartnerAuthGuard'
import { PartnerLayout } from '@/components/cabinet/PartnerLayout'

const getHeaderForPath = (pathname: string) => {
  if (pathname === '/p/dashboard') {
    return { title: 'Дашборд' }
  }
  if (pathname === '/p/deals') {
    return { title: 'Заявки' }
  }
  if (pathname === '/p/payouts') {
    return { title: 'Выплаты' }
  }
  if (pathname === '/p/profile') {
    return { title: 'Профиль магазина' }
  }
  if (pathname === '/p/support') {
    return { title: 'Поддержка' }
  }
  return { title: 'Кабинет Партнера' }
}

export default function PartnerCabinetLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const header = getHeaderForPath(pathname || '')

  return (
    <div className="min-h-screen bg-background">
      <PartnerAuthGuard>
        <PartnerLayout
          headerTitle={header.title}
          headerBreadcrumbs={header.breadcrumbItems || undefined}>
          {children}
        </PartnerLayout>
      </PartnerAuthGuard>
    </div>
  )
}

