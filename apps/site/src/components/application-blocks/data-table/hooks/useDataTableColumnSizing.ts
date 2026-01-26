import * as React from "react"
import { useLocalStorage } from "@uidotdev/usehooks"

export function useDataTableColumnSizing(collection: string, columnSizesKey: string) {
  const [columnSizing, setColumnSizing] = useLocalStorage<Record<string, number>>(columnSizesKey, {})

  React.useEffect(() => {
    if (!collection || typeof window === "undefined") return
    try {
      const key = columnSizesKey
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === "object") {
          setColumnSizing(parsed)
        } else {
          setColumnSizing({})
        }
      } else {
        setColumnSizing({})
      }
    } catch (e) {
      console.warn("Failed to restore column sizing:", e)
      setColumnSizing({})
    }
  }, [collection, columnSizesKey, setColumnSizing])

  React.useEffect(() => {
    if (collection && typeof window !== "undefined" && Object.keys(columnSizing).length > 0) {
      try {
        const isMobileDevice = window.innerWidth < 1024
        const key = isMobileDevice
          ? `column-sizes-mobile-${collection}`
          : `column-sizes-desktop-${collection}`
        localStorage.setItem(key, JSON.stringify(columnSizing))
      } catch (e) {
        console.error("Failed to save column sizes:", e)
      }
    }
  }, [columnSizing, collection])

  return { columnSizing, setColumnSizing }
}
