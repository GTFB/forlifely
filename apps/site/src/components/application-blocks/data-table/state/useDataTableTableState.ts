import * as React from "react"
import type { SearchCondition } from "@/shared/utils/search-parser"
import type { SortingState } from "@tanstack/react-table"
import { useLocalStorage } from "@uidotdev/usehooks"
import { getCollection } from "@/shared/collections/getCollection"

export function useDataTableTableState(collection: string) {
  const [searchConditions, setSearchConditions] = React.useState<SearchCondition[]>([])
  const [visibleColumns, setVisibleColumns] = React.useState<Set<string>>(new Set())
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window === "undefined") return false
    return window.innerWidth < 1024
  })

  const defaultSorting = React.useMemo<SortingState>(() => {
    const collectionConfig = getCollection(collection)
    return [...collectionConfig.__defaultSort] as SortingState
  }, [collection])

  const sortingKey = React.useMemo<string>(() => {
    return `sorting-${collection}`
  }, [collection])

  const [sorting, setSorting] = useLocalStorage(sortingKey, defaultSorting)

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return {
    searchConditions,
    setSearchConditions,
    visibleColumns,
    setVisibleColumns,
    isMobile,
    setIsMobile,
    sorting,
    setSorting,
    defaultSorting,
    sortingKey,
  }
}
