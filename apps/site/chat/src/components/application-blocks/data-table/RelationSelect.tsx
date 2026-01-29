"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { IconX } from "@tabler/icons-react"
import qs from "qs"
import type { RelationConfig } from "./types"

interface RelationSelectProps {
  relation: RelationConfig
  value: any
  onChange: (value: string | string[]) => void
  required?: boolean
  disabled?: boolean
  search?: string
}

export function RelationSelect({
  relation,
  value,
  onChange,
  required = false,
  disabled = false,
  search = "",
}: RelationSelectProps) {
  const [options, setOptions] = React.useState<Array<{ value: any; label: string }>>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadOptions() {
      setLoading(true)
      try {
        const queryParams = qs.stringify({
          c: relation.collection,
          ps: 1000,
          ...(relation.inheritSearch && search && { s: search }),
          ...(relation.filters && { filters: relation.filters }),
        })

        const res = await fetch(`/api/admin/state?${queryParams}`, {
          credentials: "include",
        })
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`)
        
        const json = await res.json() as { data: any[] }
        
        const opts = json.data.map((item: any) => {
          const value = item[relation.valueField]
          let label: string
          
          if (relation.labelFields) {
            label = relation.labelFields.map(f => item[f]).filter(Boolean).join(" ")
          } else {
            const labelFieldValue = item[relation.labelField]
            // Parse JSON if title is stored as JSON string with ru/en fields
            if (typeof labelFieldValue === 'string' && (labelFieldValue.startsWith('{') || labelFieldValue.startsWith('"'))) {
              try {
                const parsed = JSON.parse(labelFieldValue)
                if (typeof parsed === 'object' && parsed !== null) {
                  label = parsed.ru || parsed.en || String(parsed) || "-"
                } else {
                  label = String(labelFieldValue)
                }
              } catch {
                label = String(labelFieldValue || "-")
              }
            } else if (typeof labelFieldValue === 'object' && labelFieldValue !== null) {
              // If already parsed as object
              label = labelFieldValue.ru || labelFieldValue.en || String(labelFieldValue) || "-"
            } else {
              label = String(labelFieldValue || "-")
            }
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

  // Handle multiple selection
  if (relation.multiple) {
    const selectedValues = Array.isArray(value) ? value : (value ? [value] : [])
    const selectedLabels = selectedValues
      .map(v => options.find(opt => String(opt.value) === String(v))?.label)
      .filter(Boolean)
    
    const handleToggle = (optValue: string) => {
      const newValues = selectedValues.includes(optValue)
        ? selectedValues.filter(v => v !== optValue)
        : [...selectedValues, optValue]
      onChange(newValues)
    }
    
    const handleRemove = (optValue: string) => {
      const newValues = selectedValues.filter(v => v !== optValue)
      onChange(newValues)
    }
    
    return (
      <div className="space-y-2">
        <Select value="" onValueChange={handleToggle} disabled={disabled || loading}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={loading ? "Загрузка..." : "Выберите роли..."} />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] z-[9999]" position="popper" sideOffset={5}>
            {options.length === 0 && !loading ? (
              <div className="p-2 text-sm text-muted-foreground">Нет доступных опций</div>
            ) : (
              options.map((opt) => {
                const isSelected = selectedValues.includes(String(opt.value))
                return (
                  <div
                    key={opt.value}
                    className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent"
                    onClick={() => handleToggle(String(opt.value))}
                  >
                    <Checkbox checked={isSelected} />
                    <span className="text-sm">{opt.label}</span>
                  </div>
                )
              })
            )}
          </SelectContent>
        </Select>
        
        {selectedValues.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedValues.map((val, idx) => (
              <Badge key={val} variant="secondary" className="gap-1">
                {selectedLabels[idx] || val}
                <button
                  type="button"
                  onClick={() => handleRemove(val)}
                  className="ml-1 hover:bg-destructive/20 rounded-full"
                >
                  <IconX className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    )
  }
  
  // Single selection
  const stringValue = value != null ? String(value) : ""
  
  return (
    <Select value={stringValue} onValueChange={onChange} disabled={disabled || loading} required={required}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={loading ? "Загрузка..." : "Выберите..."} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px] z-[9999]" position="popper" sideOffset={5}>
        {options.length === 0 && !loading ? (
          <div className="p-2 text-sm text-muted-foreground">Нет доступных опций</div>
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

