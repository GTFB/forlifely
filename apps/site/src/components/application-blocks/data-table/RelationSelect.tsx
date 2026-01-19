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
    search,
  }: {
    relation: RelationConfig
    value: any
    onChange: (value: any) => void
    disabled?: boolean
    required?: boolean
    translations?: any
    search?: string
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
  
          const queryParams = qs.stringify({
            c: relation.collection,
            p: 1,
            ps: 1000, // Load more items for select
            ...(relation.inheritSearch && search && { s: search }),
            ...(relationFilters.length > 0 && { filters: relationFilters }),
          })
  
          const res = await fetch(`/api/admin/state?${queryParams}`, {
            credentials: "include",
          })
          if (!res.ok) throw new Error(`Failed to load: ${res.status}`)
  
          const json: StateResponse = await res.json()
  
          const opts = json.data.map((item) => ({
            value: item[relation.valueField],
            label: relation.labelFields
              ? relation.labelFields.map(f => item[f]).filter(Boolean).join(" ")
              : String(item[relation.labelField] || "-"),
          }))
  
  
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
  