'use client'

import * as React from 'react'
import {
  LayoutDashboard,
  FileText,
  Wallet,
  User,
  MessageSquare,
} from 'lucide-react'
import { CabinetSidebar, type NavigationItem } from './CabinetSidebar'

const navigationItems: NavigationItem[] = [
  {
    title: 'Главный экран',
    url: '/p/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Заявки',
    url: '/p/deals',
    icon: FileText,
  },
  {
    title: 'Выплаты',
    url: '/p/payouts',
    icon: Wallet,
  },
  {
    title: 'Профиль',
    url: '/p/profile',
    icon: User,
  },
  {
    title: 'Поддержка',
    url: '/p/support',
    icon: MessageSquare,
  },
]

interface PartnerSidebarProps {
  user?: {
    name: string
    email: string
    avatar?: string
  }
}

export function PartnerSidebar({ user }: PartnerSidebarProps) {
  return (
    <CabinetSidebar
      user={user}
      title="Кабинет Партнера"
      navigationItems={navigationItems}
      profileUrl="/p/profile"
    />
  )
}

