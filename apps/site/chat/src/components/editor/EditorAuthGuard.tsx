"use client"

import { useEffect, useState, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useRoomSocket } from "@/hooks/use-user-socket"
import { useAdminSocket } from "@/components/admin/AdminSocketProvider"

interface EditorAuthGuardProps {
  children: ReactNode
}

export default function EditorAuthGuard({ children }: EditorAuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const { emit } = useAdminSocket()

  // Redirect to login
  const redirectToLogin = () => {
    try {
      document.cookie = 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    } catch {}
    router.replace('/login')
  }

  // Check if current user is editor or admin
  const checkUserAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })

      const body = await response.json() as any

      if (!response.ok) {
        redirectToLogin()
        return false
      }

      const data: { user: { roles: { name: string }[] } } = body

      console.log('[EditorAuthGuard] User roles:', data.user.roles.map(r => r.name))

      // Allow both Editor and Administrator roles (check both cases)
      const hasAccess = data.user.roles.some((role) => 
        role.name === 'Editor' || 
        role.name === 'editor' || 
        role.name === 'Administrator' ||
        role.name === 'administrator'
      )
      
      console.log('[EditorAuthGuard] Has access:', hasAccess)
      setHasAccess(hasAccess)
      return hasAccess
    } catch (err) {
      console.error('Auth check failed:', err)
      redirectToLogin()
      return false
    }
  }
  useRoomSocket(
    hasAccess && !checking ? "editor" : "",
    {
      'update-editor': (data: { type: string; [key: string]: unknown }) => {
        // Emit event through context so pages can subscribe to specific event types
        emit(data)
      }
    }
  )
  // Initial check
  useEffect(() => {
    const checkAuth = async () => {
      const isAuthorized = await checkUserAuth()
      if (!isAuthorized) {
        console.log('[EditorAuthGuard] User not authorized, redirecting...')
        redirectToLogin()
        return
      }
      console.log('[EditorAuthGuard] User authorized, showing content')
      setChecking(false)
    }

    checkAuth()
  }, [pathname])

  if (checking) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <>{children}</>
}

