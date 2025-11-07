'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import InvestorAuthGuard from '@/components/cabinet/InvestorAuthGuard'
import { InvestorLayout } from '@/components/cabinet/InvestorLayout'

const getHeaderForPath = (pathname: string): {
  title: string
  breadcrumbItems?: Array<{ label: string; href?: string }>
} => {
  if (pathname === '/i/dashboard') {
    return { title: 'Портфель' }
  }
  if (pathname === '/i/wallet') {
    return { title: 'Мой кошелек' }
  }
  if (pathname === '/i/products') {
    return { title: 'Продукты' }
  }
  if (pathname === '/i/profile') {
    return { title: 'Профиль' }
  }
  if (pathname === '/i/support') {
    return { title: 'Поддержка' }
  }
  return { title: 'Кабинет Инвестора' }
}

export default function InvestorCabinetLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const header = getHeaderForPath(pathname || '')

  return (
    <div className="min-h-screen bg-background">
      <InvestorAuthGuard>
        <InvestorLayout
          headerTitle={header.title}
          headerBreadcrumbs={header.breadcrumbItems}>
          {children}
        </InvestorLayout>
      </InvestorAuthGuard>
    </div>
  )
}

