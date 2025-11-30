'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import PartnerAuthGuard from '@/components/cabinet/PartnerAuthGuard'
import { PartnerLayout } from '@/components/cabinet/PartnerLayout'
import { AskForNotificationPush } from '@/components/AskForNotificationPush'

const getHeaderForPath = (pathname: string): {
  title: string
  breadcrumbItems?: Array<{ label: string; href?: string }>
} => {
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
        <AskForNotificationPush />  
        <PartnerLayout
          headerTitle={header.title}
          headerBreadcrumbs={header.breadcrumbItems}>
          {children}
        </PartnerLayout>
      </PartnerAuthGuard>
    </div>
  )
}

