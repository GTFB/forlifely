"use client"

import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Bell, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"

interface Notification {
  id: number
  uuid: string | null
  title: string | null
  typeName: string | null
  isRead: boolean
  createdAt: string | Date
  updatedAt: string | Date
  dataIn: any
}

import { useNotifications } from "./NotificationsContext"

export function NotificationsDrawer() {
  const { open, setOpen: onOpenChange } = useNotifications()
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [unreadCount, setUnreadCount] = React.useState(0)

  const fetchNotifications = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/altrp/v1/admin/notifications?limit=50&offset=0", {
        credentials: "include",
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("Failed to load notifications")
      }

      const data = (await response.json()) as {
        success: boolean
        notifications?: Array<{ isRead?: boolean }>
        error?: string
      }
      if (data.success) {
        setNotifications((data.notifications || []) as Notification[])
        const unread = (data.notifications || []).filter((n) => !n.isRead).length
        setUnreadCount(unread)
      } else {
        throw new Error(data.error || "Failed to load notifications")
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err)
      setError(err instanceof Error ? err.message : "Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open, fetchNotifications])

  const markAsRead = React.useCallback(async (notificationId: number, uuid: string | null) => {
    if (!uuid) return

    try {
      const response = await fetch(`/api/altrp/v1/admin/notifications/${notificationId}/read`, {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error("Failed to mark notification as read", err)
    }
  }, [])

  const handleNotificationClick = React.useCallback(
    (notification: Notification) => {
      if (!notification.isRead && notification.uuid) {
        markAsRead(notification.id, notification.uuid)
      }

      // Navigate to relevant page based on notification type or dataIn
      if (notification.dataIn?.dealAid) {
        window.location.href = `/admin/deals?deal=${notification.dataIn.dealAid}`
      } else if (notification.dataIn?.url) {
        window.location.href = notification.dataIn.url
      }
    },
    [markAsRead]
  )

  const formatDate = React.useCallback((date: string | Date) => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date
      return formatDistanceToNow(dateObj, { addSuffix: true, locale: ru })
    } catch {
      return ""
    }
  }, [])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Уведомления
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {unreadCount > 0
              ? `У вас ${unreadCount} непрочитанных уведомлений`
              : "Все уведомления прочитаны"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="py-8 text-center text-sm text-destructive">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Нет уведомлений
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-2 pr-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`cursor-pointer rounded-lg border p-4 transition-colors hover:bg-accent ${
                      !notification.isRead ? "bg-accent/50 border-primary/20" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium leading-none">
                            {notification.title || "Уведомление"}
                          </p>
                          {!notification.isRead && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        {notification.typeName && (
                          <p className="text-xs text-muted-foreground">
                            {notification.typeName}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

