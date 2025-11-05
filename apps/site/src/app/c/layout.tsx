'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import ConsumerAuthGuard from '@/components/cabinet/ConsumerAuthGuard'
import { ConsumerLayout } from '@/components/cabinet/ConsumerLayout'

const getHeaderForPath = (pathname: string) => {
  if (pathname === '/c/dashboard') {
    return { title: 'Обзор' }
  }
  if (pathname === '/c/deals') {
    return { title: 'Мои рассрочки' }
  }
  if (pathname.startsWith('/c/deals/')) {
    const match = pathname.match(/\/c\/deals\/(.+)$/)
    const dealId = match?.[1]
    if (dealId && dealId !== 'new') {
      return {
        title: `Сделка ${dealId}`,
        breadcrumbItems: [
          { label: 'Кабинет Потребителя', href: '/c/dashboard' },
          { label: 'Мои рассрочки', href: '/c/deals' },
          { label: `Сделка ${dealId}` },
        ],
      }
    }
    return { title: 'Новая заявка' }
  }
  if (pathname === '/c/payments') {
    return { title: 'Платежи' }
  }
  if (pathname === '/c/profile') {
    return { title: 'Профиль' }
  }
  if (pathname === '/c/support') {
    return { title: 'Поддержка' }
  }
  return { title: 'Кабинет Потребителя' }
}

export default function ConsumerCabinetLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const header = getHeaderForPath(pathname || '')

  return (
    <div className="min-h-screen bg-background">
      <ConsumerAuthGuard>
        <ConsumerLayout
          headerTitle={header.title}
          headerBreadcrumbs={header.breadcrumbItems}>
          {children}
        </ConsumerLayout>
      </ConsumerAuthGuard>
    </div>
  )
}
