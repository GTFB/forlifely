"use client"

import { useEffect } from "react"

/**
 * Suppresses AbortError in development mode to prevent console noise
 * when components unmount and abort fetch requests
 */
export function AbortErrorSuppressor() {
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleError = (event: ErrorEvent) => {
      const error = event.error
      if (
        error?.name === "AbortError" ||
        error?.message?.includes("aborted") ||
        event.message?.includes("aborted")
      ) {
        event.preventDefault()
        return false
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      if (
        reason?.name === "AbortError" ||
        reason?.message?.includes("aborted") ||
        (typeof reason === "string" && reason.includes("aborted"))
      ) {
        event.preventDefault()
      }
    }

    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    return () => {
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [])

  return null
}

