import * as React from "react"
import type { SelectOption } from "../types"
import { LANGUAGES } from "@/settings"
import { getInitialLocale } from "@/lib/getInitialLocale"
import { useLocalStorage } from "@uidotdev/usehooks"

export type LanguageCode = (typeof LANGUAGES)[number]["code"]

export function useDataTableMetaState(collection: string) {
  const [locale, setLocale] = useLocalStorage<LanguageCode>("sidebar-locale", getInitialLocale())
  const [translations, setTranslations] = React.useState<any>(null)
  const [taxonomyConfig, setTaxonomyConfig] = React.useState<any>(null)
  const [segmentStatuses, setSegmentStatuses] = React.useState<SelectOption[]>([])

  const supportedLanguageCodes = React.useMemo(() => LANGUAGES.map((l) => l.code), [])

  // Load Taxonomy config when collection is taxonomy
  React.useEffect(() => {
    if (collection === "taxonomy" && typeof window !== "undefined") {
      import("../../../../../../app/src/collections/Taxonomy")
        .then((module) => {
          setTaxonomyConfig(module.Taxonomy)
        })
        .catch((e) => {
          console.error("[DataTable] Failed to load Taxonomy config:", e)
        })
    } else {
      setTaxonomyConfig(null)
    }
  }, [collection])

  // Load segment statuses from taxonomy for expanses.status_name
  const loadSegmentStatuses = React.useCallback(async () => {
    try {
      const filters = {
        conditions: [
          {
            field: "entity",
            operator: "eq",
            values: ["Segment"],
          },
        ],
      }
      const orders = {
        orders: [{ field: "sortOrder", direction: "asc" }],
      }
      const params = new URLSearchParams()
      params.append("filters", JSON.stringify(filters))
      params.append("orders", JSON.stringify(orders))
      params.append("limit", "1000")

      const response = await fetch(`/api/admin/taxonomies?${params.toString()}`, {
        credentials: "include",
      })
      if (!response.ok) {
        const errorText = await response.text()
        console.error("[DataTable] Failed to load segment statuses:", response.status, errorText)
        throw new Error(`Failed to load statuses: ${response.status}`)
      }

      const data = (await response.json()) as {
        docs?: Array<{ name?: string; title?: string | Record<string, string>; sortOrder?: number }>
      }
      const options = (data.docs || []).map((status: any) => {
        let label = status.name || ""
        if (status.title) {
          const title = typeof status.title === "string" ? JSON.parse(status.title) : status.title
          label = title[locale] || title.en || title.ru || title.rs || status.name
        }
        return {
          value: status.name || "",
          label: label,
        }
      })
      setSegmentStatuses(options)
    } catch (e) {
      console.error("Failed to load segment statuses:", e)
      setSegmentStatuses([])
    }
  }, [locale, setSegmentStatuses])

  // Load segment statuses when collection is expanses
  React.useEffect(() => {
    if (collection === "expanses") {
      void loadSegmentStatuses()
    } else {
      setSegmentStatuses([])
    }
  }, [collection, loadSegmentStatuses, setSegmentStatuses])

  // Sync locale with sidebar when it changes
  React.useEffect(() => {
    const handleLocaleChanged = (e: StorageEvent | CustomEvent) => {
      const newLocale = (e as CustomEvent).detail || (e as StorageEvent).newValue
      if (newLocale && supportedLanguageCodes.includes(newLocale as LanguageCode)) {
        setLocale(newLocale as LanguageCode)
      }
    }

    window.addEventListener("storage", handleLocaleChanged as EventListener)
    window.addEventListener("sidebar-locale-changed", handleLocaleChanged as EventListener)

    return () => {
      window.removeEventListener("storage", handleLocaleChanged as EventListener)
      window.removeEventListener("sidebar-locale-changed", handleLocaleChanged as EventListener)
    }
  }, [supportedLanguageCodes, setLocale])

  // Load translations
  React.useEffect(() => {
    const loadTranslations = async () => {
      try {
        const cacheKey = `sidebar-translations-${locale}`
        const cached = typeof window !== "undefined" ? sessionStorage.getItem(cacheKey) : null

        if (cached) {
          try {
            const cachedTranslations = JSON.parse(cached)
            setTranslations(cachedTranslations)
          } catch (e) {
            console.error("[DataTable] Failed to parse cached translations:", e)
          }
        }

        const response = await fetch(`/api/locales/${locale}`)
        if (!response.ok) {
          throw new Error(`Failed to load translations: ${response.status}`)
        }
        const translationsData = await response.json()

        setTranslations(translationsData)

        if (typeof window !== "undefined") {
          sessionStorage.setItem(cacheKey, JSON.stringify(translationsData))
        }
      } catch (e) {
        console.error("[DataTable] Failed to load translations:", e)
        try {
          try {
            const translationsModule = await import(`@/packages/content/locales/${locale}.json`)
            setTranslations(translationsModule.default || translationsModule)
          } catch {
            const translationsModule = await import("@/packages/content/locales/en.json")
            setTranslations(translationsModule.default || translationsModule)
          }
        } catch (fallbackError) {
          console.error("Fallback import also failed:", fallbackError)
        }
      }
    }

    void loadTranslations()
  }, [locale])

  return {
    locale,
    setLocale,
    translations,
    setTranslations,
    taxonomyConfig,
    setTaxonomyConfig,
    segmentStatuses,
    setSegmentStatuses,
    supportedLanguageCodes,
  }
}
