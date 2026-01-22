import { AdminFilter } from "@/shared/types"
import { RelationConfig, StateResponse } from "./types"
import * as React from "react"
import qs from "qs"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Relation Select Component
export function RelationSelect({
  relation,
  value,
  onChange,
  disabled,
  required,
  translations,
  locale = 'en',
  search,
}: {
  relation: RelationConfig
  value: any
  onChange: (value: any) => void
  disabled?: boolean
  required?: boolean
  translations?: any
  search?: string
  locale?: string
}) {
  const [options, setOptions] = React.useState<Array<{ value: any; label: string }>>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const loadOptions = async () => {
      setLoading(true)
      try {
        // Compose relation filters: defaults from schema
        const relationFilters: AdminFilter[] = []
        if (Array.isArray(relation.filters)) {
          relationFilters.push(...relation.filters)
        }
        // ALWAYS check what entity values exist in DB for taxonomy when loading taxonomy options
        // This helps debug what entity values are actually stored in the database
        if (relation.collection === 'taxonomy') {
          console.log(`[RelationSelect] ===== DEBUG: Making query to taxonomy to see ALL entity values =====`)
          const debugQueryParams = qs.stringify({
            c: 'taxonomy',
            p: 1,
            ps: 1000, // Get more records to see all entity values
          })

          console.log(`[RelationSelect] Debug query URL: /api/admin/state?${debugQueryParams}`)

          try {
            const debugRes = await fetch(`/api/admin/state?${debugQueryParams}`, {
              credentials: "include",
            })
            console.log(`[RelationSelect] Debug query response status:`, debugRes.status)

            if (debugRes.ok) {
              const debugJson: StateResponse = await debugRes.json()

              const uniqueEntities = [...new Set(debugJson.data?.map((item: any) => item.entity) || [])]

              // Group by entity to see what records exist for each
              const byEntity: Record<string, any[]> = {}
              debugJson.data?.forEach((item: any) => {
                if (!byEntity[item.entity]) {
                  byEntity[item.entity] = []
                }
                byEntity[item.entity].push({
                  id: item.id,
                  name: item.name,
                  title: item.title,
                })
              })

            } else {
              const errorText = await debugRes.text()
              console.error(`[RelationSelect] Debug query failed with status:`, debugRes.status, `Error:`, errorText)
            }
          } catch (debugError) {
            console.error(`[RelationSelect] Debug query error:`, debugError)
          }
        }
        const queryParams = qs.stringify({
          c: relation.collection,
          p: 1,
          ps: 1000, // Load more items for select
          ...(relation.inheritSearch && search && { s: search }),
          ...(relationFilters.length > 0 && { filters: relationFilters }),
        }, {
          arrayFormat: 'brackets', // Use brackets format for arrays: filters[0][field]=entity
          encode: false, // Don't encode, let browser handle it
        })

        const res = await fetch(`/api/admin/state?${queryParams}`, {
          credentials: "include",
        })
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`)

        const json: StateResponse = await res.json()

                
        const opts = json.data.map((item) => {
          const value = item[relation.valueField]
          let label: string
          
          // If labelField is 'title' and collection is 'taxonomy', parse JSON
          if (relation.collection === 'taxonomy' && relation.labelField === 'title') {
            let titleValue = item[relation.labelField]
            
            // Parse JSON if it's a string
            if (typeof titleValue === 'string') {
              try {
                titleValue = JSON.parse(titleValue)
              } catch {
                // Not JSON, use as-is
              }
            }
            
            // Extract locale-specific value
            if (titleValue && typeof titleValue === 'object') {
              label = titleValue[locale] || titleValue.en || titleValue.ru || titleValue.rs || "-"
            } else {
              label = String(titleValue || "-")
            }
          } else {
            // Regular field handling
            label = relation.labelFields
              ? relation.labelFields.map(f => item[f]).filter(Boolean).join(" ")
              : String(item[relation.labelField] || "-")
          }
          
          return { value, label }
        })


        setOptions(opts)
      } catch (e) {
        console.error(`[RelationSelect] Failed to load options for ${relation.collection}:`, e)
      } finally {
        setLoading(false)
      }
    }

    loadOptions()
  }, [relation, search])

  return (
    <Select value={value ? String(value) : ""} onValueChange={(val) => {
      // Convert string back to original value type if needed
      // For relation fields, we want to preserve the original value type (could be string or number)
      const originalValue = options.find(opt => String(opt.value) === val)?.value
      // Always use the original value from options if found, otherwise use the string value
      // This ensures we pass the actual ID, not a string representation
      const finalValue = originalValue !== undefined ? originalValue : val
      // Ensure we never pass an object - only primitives (string, number, null)
      if (typeof finalValue === 'object' && finalValue !== null) {
        console.warn('[RelationSelect] Attempted to pass object value, using null instead:', finalValue)
        onChange(null)
      } else {
        onChange(finalValue)
      }
    }} disabled={disabled || loading} required={required}>
      <SelectTrigger>
        <SelectValue placeholder={loading ? (translations?.form?.loading || "Loading...") : (translations?.form?.selectPlaceholder || "Select...")} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px] z-10002" position="popper" sideOffset={5}>
        {options.length === 0 && !loading ? (
          <div className="p-2 text-sm text-muted-foreground">{(translations as any)?.form?.noOptionsAvailable || "No options available"}</div>
        ) : (
          options.map((opt) => (
            <SelectItem key={opt.value} value={String(opt.value)}>
              {opt.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}
