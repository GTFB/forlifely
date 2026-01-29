"use client"

import { useEffect, useState, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export function getMeUser() {
  const [me, setMe] = useState<{ user: any } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setMe(data as { user: any } | null))
      .catch(() => setMe(null))
      .finally(() => setLoading(false))
  }, [])

  return { me, loading }
}

interface RoleAuthGuardProps {
  children: ReactNode
  allowedRoles?: string[]
  allowedRaids?: string[]
  redirectTo?: string
}

export default function RoleAuthGuard({
  children,
  allowedRoles = [],
  allowedRaids = [],
  redirectTo = "/login",
}: RoleAuthGuardProps) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  const redirect = () => {
    try {
      document.cookie = 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    } catch {}
    router.replace(redirectTo)
  }

  const checkAccess = async () => {
    try {
      const response = await fetch("/api/auth/me", { credentials: "include" })
      
      const body = await response.json() as any

      if (!response.ok) {
        redirect()
        return false
      }

      const data: { 
        user: { 
          roles?: Array<{ raid: string | null; [key: string]: any }>; 
          isAdmin?: boolean 
        } 
      } = body
      const isSystemAdmin = Boolean(data.user.isAdmin)

      // Extract raid values from roles array
      const userRaids = (data.user.roles || [])
        .map((r) => r.raid)
        .filter((v): v is string => Boolean(v))

      const roleAllowed = allowedRoles.length
        ? allowedRoles.some((r) => userRaids.includes(r))
        : false
      const raidAllowed = allowedRaids.length
        ? allowedRaids.some((r) => userRaids.includes(r))
        : false

      if (!(roleAllowed || raidAllowed || isSystemAdmin)) {
        redirect()
        return false
      }

      return true
    } catch (err) {
      console.error("Role auth check failed:", err)
      redirect()
      return false
    }
  }

  useEffect(() => {
    const run = async () => {
      const ok = await checkAccess()
      if (ok) setChecking(false)
    }
    run()
    // Periodic re-check each minute
    const interval = setInterval(() => {
      checkAccess()
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <>{children}</>
}


