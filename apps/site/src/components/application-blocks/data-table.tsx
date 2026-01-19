"use client"

import * as React from "react"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconLayoutColumns,
  IconLayoutGrid,
  IconLoader,
  IconPlus,
  IconCheck,
  IconX,
  IconSearch,
  IconTrash,
  IconArrowUp,
  IconArrowDown,
  IconArrowsSort,
  IconCopy,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconFilter,
  IconDownload,
  IconUpload,
  IconCalendar,
  IconGripVertical,
  IconEdit,
  IconDeviceFloppy,
  IconTag,
  IconMapPin,
} from "@tabler/icons-react"
import { getCollection } from "@/shared/collections/getCollection"
import BaseColumn from "@/shared/columns/BaseColumn"
import type { AdminFilter } from "@/shared/types"
import { parseSearchQuery, matchesSearchQuery, type ParsedSearchQuery, type SearchCondition } from "@/shared/utils/search-parser"
import { exportTable, getFileExtension, getMimeType, addBOM, type ExportFormat } from "@/shared/utils/table-export"
import { parseImportFile, importRows, type ImportFormat } from "@/shared/utils/table-import"
import { DateTimePicker } from "@/packages/components/ui/date-time-picker"
import { DayPicker, DateRange } from "react-day-picker"
import { ru, enUS, sr } from "date-fns/locale"
import "react-day-picker/dist/style.css"
import { PhoneInput } from "@/packages/components/ui/phone-input"
import qs from "qs"
import { LANGUAGES, PROJECT_SETTINGS } from "@/settings"
import { useMe } from "@/providers/MeProvider"
import {
  getTableDataInFields,
  getTableColumnVisibility,
} from "@/shared/utils/table-settings"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
  HeaderContext,
} from "@tanstack/react-table"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/packages/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useAdminState } from "@/components/admin/AdminStateProvider"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogClose,
} from "@/packages/components/ui/revola"

import { useLocalStorage } from '@uidotdev/usehooks'

type ColumnSchema = {
  name: string
  type: string
  nullable: boolean
  primary: boolean
}

type RelationConfig = {
  collection: string
  valueField: string
  labelField: string
  labelFields?: string[]
  filters?: AdminFilter[]
  inheritSearch?: boolean
}

type SelectOption = {
  label: string
  value: string
}

type ColumnSchemaExtended = ColumnSchema & {
  title?: string
  hidden?: boolean
  hiddenTable?: boolean
  readOnly?: boolean
  required?: boolean
  virtual?: boolean
  defaultCell?: any
  format?: (value: any, locale?: string) => string
  fieldType?: 'text' | 'number' | 'email' | 'phone' | 'password' | 'boolean' | 'date' | 'time' | 'datetime' | 'json' | 'array' | 'object' | 'price' | 'enum' | 'select'
  textarea?: boolean
  enum?: {
    values: string[]
    labels: string[]
  }
  relation?: RelationConfig
  selectOptions?: SelectOption[]
}

type CollectionData = Record<string, any>

type StateResponse = {
  success: boolean
  error?: string
  state: {
    collection: string
    page: number
    pageSize: number
    filters: AdminFilter[]
  }
  schema: {
    columns: ColumnSchema[]
    total: number
    totalPages: number
  }
  data: CollectionData[]
}

// Helper to format cell value
function formatCellValue(value: any): React.ReactNode {
  if (value === null || value === undefined) return "-"
  if (typeof value === "boolean") {
    return (
      <div className="flex items-center justify-center">
        {value ? <IconCheck className="size-4 text-green-600" /> : <IconX className="size-4 text-red-600" />}
      </div>
    )
  }
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

function formatDateTimeForLocale(value: any, locale: string): string {
  if (!value) return "-"
  try {
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return String(value)

    const loc = locale === "ru" ? "ru-RU" : locale === "rs" ? "sr-RS" : "en-US"
    return new Intl.DateTimeFormat(loc, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  } catch {
    return String(value)
  }
}

function truncateMiddle(value: string, head: number = 8, tail: number = 6): string {
  const v = String(value || "")
  if (v.length <= head + tail + 1) return v
  return `${v.slice(0, head)}…${v.slice(-tail)}`
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // ignore
  }
}

// Combobox Component for select fields with search
function ComboboxSelect({
  options,
  value,
  onValueChange,
  placeholder,
  disabled,
  required,
  id,
  translations,
}: {
  options: Array<{ value: string; label: string }>
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  id?: string
  translations?: any
}) {
  const [open, setOpen] = React.useState(false)

  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedOption ? selectedOption.label : placeholder || "Select..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-10002" align="start">
        <Command>
          <CommandInput placeholder={placeholder || "Search..."} />
          <CommandList>
            <CommandEmpty>{(translations as any)?.form?.noResults || "No results found."}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.value}`}
                  onSelect={() => {
                    onValueChange(option.value === value ? "" : option.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Multiselect Component for filter fields
function ColumnFilterMultiselect({
  options,
  value,
  onValueChange,
  placeholder,
  translations,
}: {
  options: Array<{ value: string; label: string }>
  value: string[]
  onValueChange: (value: string[]) => void
  placeholder?: string
  translations?: any
}) {
  const [open, setOpen] = React.useState(false)

  const selectedValues = Array.isArray(value) ? value : []
  const selectedOptions = options.filter((opt) => selectedValues.includes(opt.value))
  const t = translations?.dataTable || translations

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-7 text-xs"
        >
          <span className="truncate">
            {selectedOptions.length > 0
              ? `${selectedOptions.length} ${t?.form?.selected || "selected"}`
              : placeholder || t?.form?.selectPlaceholder || "Select..."}
          </span>
          {selectedOptions.length === 0 && (
            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-10002" align="start">
        <Command>
          <CommandInput placeholder={t?.search || "Search..."} className="h-8" />
          <CommandList>
            <CommandEmpty>{t?.form?.noResults || "No results found."}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.value}`}
                    onSelect={() => {
                      if (isSelected) {
                        onValueChange(selectedValues.filter((v) => v !== option.value))
                      } else {
                        onValueChange([...selectedValues, option.value])
                      }
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Media Upload Input Component
function MediaUploadInput({
  value,
  onChange,
  disabled,
  translations,
}: {
  value: string
  onChange: (uuid: string) => void
  disabled?: boolean
  translations?: any
}) {
  const [uploading, setUploading] = React.useState(false)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Load preview if value exists
  React.useEffect(() => {
    if (value) {
      setPreviewUrl(`/api/altrp/v1/admin/files/${value}`)
    } else {
      setPreviewUrl(null)
    }
  }, [value])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate image file
    if (!file.type.startsWith('image/')) {
      alert(translations?.form?.invalidImage || 'Please select an image file')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/altrp/v1/admin/files/upload-for-public', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json() as { success: boolean; data?: { uuid: string } }
      if (result.success && result.data?.uuid) {
        onChange(result.data.uuid)
      } else {
        throw new Error('Upload response invalid')
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
      alert(translations?.form?.uploadError || 'Failed to upload image')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = () => {
    onChange('')
    setPreviewUrl(null)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Preview"
              className="h-20 w-20 rounded object-cover border"
              onError={() => setPreviewUrl(null)}
            />
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploading}
              >
                {uploading ? (translations?.form?.uploading || 'Uploading...') : (translations?.form?.changeImage || 'Change Image')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={disabled || uploading}
              >
                {translations?.form?.remove || 'Remove'}
              </Button>
            </div>
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="w-full"
          >
            {uploading ? (translations?.form?.uploading || 'Uploading...') : (translations?.form?.uploadImage || 'Upload Image')}
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading}
        />
      </div>
      {value && (
        <Input
          type="text"
          value={value}
          readOnly
          className="font-mono text-xs"
          placeholder="Media UUID"
        />
      )}
    </div>
  )
}

// Relation Select Component
function RelationSelect({
  relation,
  value,
  onChange,
  disabled,
  required,
  translations,
  search,
  locale = 'en',
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
              console.log(`[RelationSelect] Debug query returned ${debugJson.data?.length || 0} records`)
              
              const uniqueEntities = [...new Set(debugJson.data?.map((item: any) => item.entity) || [])]
              console.log(`[RelationSelect] ===== ALL ENTITY VALUES IN TAXONOMY DB =====`)
              console.log(`[RelationSelect] Unique entity values:`, uniqueEntities)
              console.log(`[RelationSelect] Total unique entities:`, uniqueEntities.length)
              
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
              
              console.log(`[RelationSelect] Records grouped by entity:`, byEntity)
              console.log(`[RelationSelect] Count per entity:`, Object.keys(byEntity).reduce((acc, key) => {
                acc[key] = byEntity[key].length
                return acc
              }, {} as Record<string, number>))
              console.log(`[RelationSelect] ============================================`)
              
              // Show sample records
              console.log(`[RelationSelect] Sample taxonomy records (first 20):`, debugJson.data?.slice(0, 20).map((item: any) => ({
                id: item.id,
                entity: item.entity,
                name: item.name,
                title: typeof item.title === 'string' ? item.title : JSON.stringify(item.title),
              })))
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

        console.log(`[RelationSelect] Loading options for ${relation.collection}:`, {
          relation,
          filters: relationFilters,
          queryParams,
          url: `/api/admin/state?${queryParams}`,
          // Show exact filter values being sent
          filterValues: relationFilters.map(f => ({ field: f.field, op: f.op, value: f.value })),
        })

        const res = await fetch(`/api/admin/state?${queryParams}`, {
          credentials: "include",
        })
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`)
        
        const json: StateResponse = await res.json()
        
        console.log(`[RelationSelect] Received response for ${relation.collection}:`, {
          success: json.success,
          dataLength: json.data?.length,
          data: json.data,
          // Log first few items to see entity values
          sampleEntities: json.data?.slice(0, 5).map((item: any) => ({
            entity: item.entity,
            name: item.name,
            title: item.title,
          })),
        })
        
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
        
        console.log(`[RelationSelect] Loaded ${opts.length} options for ${relation.collection}:`, opts)
        setOptions(opts)
      } catch (e) {
        console.error(`[RelationSelect] Failed to load options for ${relation.collection}:`, e)
      } finally {
        setLoading(false)
      }
    }

    loadOptions()
  }, [relation, search, locale])

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
        console.log(`[RelationSelect] ${relation.collection} onChange:`, { val, originalValue, finalValue, type: typeof finalValue })
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

// Relation Multiselect Component (for column filters)
function RelationMultiselect({
  relation,
  value,
  onChange,
  disabled,
  translations,
  locale = 'en',
}: {
  relation: RelationConfig
  value: string | string[] | null
  onChange: (value: string[] | null) => void
  disabled?: boolean
  translations?: any
  locale?: string
}) {
  const [options, setOptions] = React.useState<Array<{ value: any; label: string }>>([])
  const [loading, setLoading] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  // Convert value to array
  const selectedValues = React.useMemo(() => {
    if (!value) return []
    if (Array.isArray(value)) return value.map(v => String(v))
    return [String(value)]
  }, [value])

  React.useEffect(() => {
    const loadOptions = async () => {
      setLoading(true)
      try {
        const relationFilters: AdminFilter[] = []
        if (Array.isArray(relation.filters)) {
          relationFilters.push(...relation.filters)
        }

        const queryParams = qs.stringify({
          c: relation.collection,
          p: 1,
          ps: 1000,
          ...(relationFilters.length > 0 && { filters: relationFilters }),
        }, {
          arrayFormat: 'brackets',
          encode: false,
        })

        const res = await fetch(`/api/admin/state?${queryParams}`, {
          credentials: "include",
        })
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`)
        
        const json: StateResponse = await res.json()
        
        const opts = json.data.map((item) => {
          const val = item[relation.valueField]
          let label: string
          
          if (relation.collection === 'taxonomy' && relation.labelField === 'title') {
            let titleValue = item[relation.labelField]
            
            if (typeof titleValue === 'string') {
              try {
                titleValue = JSON.parse(titleValue)
              } catch {
                // Not JSON, use as-is
              }
            }
            
            if (titleValue && typeof titleValue === 'object') {
              label = titleValue[locale] || titleValue.en || titleValue.ru || titleValue.rs || "-"
            } else {
              label = String(titleValue || "-")
            }
          } else {
            label = relation.labelFields
              ? relation.labelFields.map(f => item[f]).filter(Boolean).join(" ")
              : String(item[relation.labelField] || "-")
          }
          
          return { value: val, label }
        })
        
        setOptions(opts)
      } catch (e) {
        console.error(`[RelationMultiselect] Failed to load options for ${relation.collection}:`, e)
      } finally {
        setLoading(false)
      }
    }

    loadOptions()
  }, [relation, locale])

  const selectedOptions = options.filter(opt => selectedValues.includes(String(opt.value)))
  const t = translations?.dataTable || translations

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-7 text-xs"
          disabled={disabled || loading}
        >
          <span className="truncate">
            {selectedOptions.length > 0
              ? `${selectedOptions.length} ${t?.form?.selected || "selected"}`
              : (t?.form?.selectPlaceholder || "Select...")}
          </span>
          {selectedOptions.length === 0 && (
            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-10002" align="start">
        <Command>
          <CommandInput placeholder={t?.search || "Search..."} className="h-8" />
          <CommandList>
            <CommandEmpty>{t?.form?.noResults || "No results found."}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.includes(String(option.value))
                return (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.value}`}
                    onSelect={() => {
                      if (isSelected) {
                        const newValues = selectedValues.filter((v) => v !== String(option.value))
                        onChange(newValues.length > 0 ? newValues : null)
                      } else {
                        onChange([...selectedValues, String(option.value)])
                      }
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{option.label}</span>
                      {isSelected && <IconCheck className="h-4 w-4 ml-auto" />}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        {selectedValues.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => onChange(null)}
            >
              {t?.form?.clear || "Clear"}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// Helper function to get data_in field label
function getDataInFieldLabel(
  baseKey: string,
  rowData: CollectionData | null,
  locale: string,
  translations: any,
  collection: string
): string | null {
  let fieldTitle: string | null = null
  
  // Try to get title from data_in structure in current row
  if (rowData?.data_in) {
    try {
      let parsed: any = rowData.data_in
      if (typeof rowData.data_in === 'string') {
        try {
          parsed = JSON.parse(rowData.data_in)
        } catch (e) {
          // Not JSON, ignore
        }
      }
      
      if (parsed && typeof parsed === 'object') {
        // Find the key (case-insensitive, with or without language suffix)
        const foundKey = Object.keys(parsed).find(key => {
          const langMatch = key.match(/^(.+)_([a-z]{2})$/i)
          if (langMatch && langMatch[1].toLowerCase() === baseKey.toLowerCase()) {
            return true
          }
          return key.toLowerCase() === baseKey.toLowerCase()
        })
        
        if (foundKey && parsed[foundKey] !== undefined) {
          const value = parsed[foundKey]
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Try current locale first, then fallback to other locales
            const localeValue = value[locale] || value.en || value.ru || value.rs || null
            if (localeValue !== null && localeValue !== undefined && typeof localeValue === 'object' && 'title' in localeValue) {
              fieldTitle = localeValue.title || null
            }
          }
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  // Try to get translation from translations object
  const fieldTranslation = translations?.dataTable?.fields?.[collection]?.[baseKey]
  
  // Return fieldTitle or fieldTranslation, but not baseKey directly
  return fieldTitle || fieldTranslation || null
}

// Dynamic column generator
function generateColumns(schema: ColumnSchemaExtended[], onDeleteRequest: (row: Row<CollectionData>) => void, onEditRequest: (row: Row<CollectionData>) => void, onDuplicateRequest?: (row: Row<CollectionData>) => void, locale: string = 'en', relationData: Record<string, Record<any, string>> = {}, translations?: any, collection?: string, data?: CollectionData[], columnVisibility?: VisibilityState, columnAlignment?: Record<string, 'left' | 'center' | 'right'>, columnSizing?: Record<string, number>, editMode: boolean = false, handleCellUpdate?: (rowId: string | number, fieldName: string, value: any) => void, fullSchema?: ColumnSchemaExtended[], editedCells?: Map<string, Record<string, any>>, segmentStatuses?: SelectOption[]): ColumnDef<CollectionData>[] {
  return [
  {
    id: "select",
    enableResizing: false,
    size: 40,
    minSize: 40,
    maxSize: 40,
    header: ({ table }) => (
      <div className="flex items-center justify-center p-0">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center p-0">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
    ...schema.filter(col => !col.hidden && !col.hiddenTable).map((col) => {
      // Set smaller default size for ID and media_id columns in contractors collection
      const isContractorsId = collection === 'contractors' && col.name === 'id'
      const isContractorsLogo = collection === 'contractors' && col.name === 'media_id'
      // For ID, allow smaller sizes (user can set 50px)
      const defaultSize = isContractorsId ? 80 : (isContractorsLogo ? 80 : undefined)
      const defaultMinSize = isContractorsId ? 50 : (isContractorsLogo ? 80 : 100)
      const defaultMaxSize = isContractorsId ? undefined : (isContractorsLogo ? 120 : undefined)
      
      // Check if this column has a relation (for multiselect filtering)
      const hasRelation = col.relation
      
      // Determine if this is a multiselect field
      const isMultiselect = !hasRelation && (
        (col.fieldType === 'select' && col.selectOptions) ||
        (col.fieldType === 'enum' && col.enum) ||
        col.fieldType === 'array' ||
        (col as any).multiple === true
      )
      
      // Custom filter function for multiselect and relation fields (OR logic)
      const customFilterFn = (isMultiselect || hasRelation) ? (row: any, columnId: string, filterValue: any) => {
        if (!filterValue) {
          return true
        }
        
        // Handle array values (multiselect) - OR logic
        if (Array.isArray(filterValue)) {
          if (filterValue.length === 0) {
            return true
          }
          const cellValue = row.getValue(columnId) as string | null | undefined
          // OR logic: cell value should be in the filter array
          return cellValue ? filterValue.includes(cellValue) : false
        }
        
        // Handle single value (relation or text filter)
        const cellValue = row.getValue(columnId) as string | null | undefined
        return cellValue ? String(cellValue) === String(filterValue) : false
      } : undefined
      
      return {
      id: col.name, // Explicitly set id to match accessorKey
      accessorKey: col.name,
      enableSorting: true,
      enableResizing: true,
      size: columnSizing?.[col.name] || defaultSize,
      minSize: defaultMinSize,
      maxSize: defaultMaxSize,
      ...(customFilterFn && { filterFn: customFilterFn }),
      header: ({ column, table }: HeaderContext<CollectionData, unknown>) => {
        const sortedIndex = table.getState().sorting.findIndex((s: any) => s.id === column.id)
        const isSorted = column.getIsSorted()
        // Get alignment for this column
        const alignment = columnAlignment?.[col.name] || 'left'
        const isCentered = alignment === 'center'
        const isRight = alignment === 'right'
        const hasMultipleSorts = table.getState().sorting.length > 1
        const headerAlignClass = isCentered ? 'justify-center' : isRight ? 'justify-end' : 'justify-start'
        
        return (
          <Button
            variant="ghost"
            className={`h-auto p-0 hover:bg-transparent font-semibold ${headerAlignClass}`}
            onClick={(e) => {
              if (e.shiftKey) {
                // Shift + click: add to multi-sort
                column.toggleSorting(isSorted === "asc", true)
              } else {
                // Regular click: toggle sort (replaces existing sorts)
                column.toggleSorting(isSorted === "asc")
              }
            }}
            title={column.getCanSort() ? (hasMultipleSorts ? (translations as any)?.dataTable?.sortTooltipMultiple || "Click: change sort | Shift+Click: add to sort" : (translations as any)?.dataTable?.sortTooltipSingle || "Click: sort | Shift+Click: add to sort") : undefined}
          >
            <div className={`flex items-center gap-1 ${headerAlignClass}`}>
              <span>{(translations as any)?.fields?.[collection || '']?.[col.name] || col.title || col.name}</span>
              {col.primary && (
                <Badge variant="outline" className="text-[10px] px-0 py-0">
                  PK
                </Badge>
              )}
              {column.getCanSort() && (
                <span className="ml-1 flex items-center gap-0.5">
                  {isSorted ? (
                    <>
                      {isSorted === "asc" ? (
                      <IconArrowUp className="h-3 w-3" />
                  ) : (
                      <IconArrowDown className="h-3 w-3" />
                      )}
                      {sortedIndex >= 0 && hasMultipleSorts && (
                        <Badge variant="secondary" className="text-[9px] px-0 py-0 h-4 min-w-4 flex items-center justify-center font-semibold">
                          {sortedIndex + 1}
                        </Badge>
                      )}
                    </>
                  ) : (
                    <IconArrowsSort className="h-3 w-3 opacity-30" />
                  )}
                </span>
              )}
            </div>
          </Button>
        )
      },
      cell: ({ row }: { row: Row<CollectionData> }) => {
        // Get row ID for updates
        const primaryKey = (fullSchema || schema).find((f: ColumnSchemaExtended) => f.primary)?.name || 'id'
        const rowId = row.original[primaryKey]
        const rowIdStr = String(rowId)
        
        // Get value - check editedCells first, then original value
        const editedValue = editedCells?.get(rowIdStr)?.[col.name]
        const value = editedValue !== undefined ? editedValue : row.original[col.name]
        
        // Get alignment for this column
        const alignment = columnAlignment?.[col.name] || (col.name === 'is_system' || col.name === 'order' ? 'center' : 'left')
        const alignmentClass = alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left'
        
        // Edit mode: return editable components
        if (editMode && handleCellUpdate && !col.primary && !col.hidden && col.name !== 'id' && col.name !== 'uuid' && col.name !== 'created_at' && col.name !== 'updated_at') {
          // Boolean fields - Checkbox
          if (col.fieldType === 'boolean') {
            const boolValue = value === 1 || value === true || value === '1' || value === 'true'
            return (
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={boolValue}
                  onCheckedChange={(checked) => {
                    void handleCellUpdate(rowId, col.name, checked)
                  }}
                />
              </div>
            )
          }
          
          // Select fields
          if (col.fieldType === 'select' && col.selectOptions) {
            return (
              <Select
                value={value ? String(value) : ""}
                onValueChange={(val) => {
                  void handleCellUpdate(rowId, col.name, val)
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {col.selectOptions.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          }
          
          // Enum fields
          if (col.fieldType === 'enum' && col.enum) {
            return (
              <Select
                value={value ? String(value) : ""}
                onValueChange={(val) => {
                  void handleCellUpdate(rowId, col.name, val)
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {col.enum.values.map((val, idx) => (
                    <SelectItem key={val} value={String(val)}>
                      {col.enum!.labels[idx]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          }
          
          // Relation fields
          if (col.relation) {
            return (
              <RelationSelect
                relation={col.relation}
                value={value}
                onChange={(val) => {
                  void handleCellUpdate(rowId, col.name, val)
                }}
                translations={translations}
                locale={locale}
              />
            )
          }
          
          // Price fields
          if (col.fieldType === 'price') {
            const cents = value === null || value === undefined || value === '' ? NaN : Number(value)
            const amount = isFinite(cents) ? (cents / 100).toFixed(2) : ''
            return (
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => {
                  const numValue = parseFloat(e.target.value)
                  if (!isNaN(numValue)) {
                    void handleCellUpdate(rowId, col.name, Math.round(numValue * 100))
                  }
                }}
                className="h-8 text-xs"
              />
            )
          }
          
          // Number fields
          if (col.fieldType === 'number') {
            return (
              <Input
                type="number"
                value={value ?? ''}
                onChange={(e) => {
                  const numValue = parseFloat(e.target.value)
                  if (!isNaN(numValue)) {
                    void handleCellUpdate(rowId, col.name, numValue)
                  } else if (e.target.value === '') {
                    void handleCellUpdate(rowId, col.name, null)
                  }
                }}
                className="h-8 text-xs"
              />
            )
          }
          
          // Textarea fields
          if (col.textarea) {
            return (
              <Textarea
                value={value ?? ''}
                onChange={(e) => {
                  void handleCellUpdate(rowId, col.name, e.target.value)
                }}
                className="h-8 text-xs min-h-[32px]"
                rows={1}
              />
            )
          }
          
          // Default: text input
          return (
            <Input
              type="text"
              value={value ?? ''}
              onChange={(e) => {
                void handleCellUpdate(rowId, col.name, e.target.value)
              }}
              className="h-8 text-xs"
            />
          )
        }
        
        // Non-edit mode: return display components
        if (col.name === 'id') {
          return <div className={`font-mono tabular-nums ${alignmentClass}`}>{value ?? "-"}</div>
        }

        if (col.name === 'uuid' || col.name === 'raid') {
          const raw = value ? String(value) : ""
          if (!raw) return <div>-</div>
          return (
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs" title={raw}>
                {truncateMiddle(raw)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  void copyToClipboard(raw)
                }}
              >
                <IconCopy className="h-4 w-4" />
                <span className="sr-only">{translations?.copy || "Copy"}</span>
              </Button>
            </div>
          )
        }

        if (col.name === 'created_at' || col.name === 'updated_at') {
          return <div className={`whitespace-nowrap ${alignmentClass}`}>{formatDateTimeForLocale(value, locale)}</div>
        }

        // For boolean type, show checkbox-like display
        if (col.fieldType === 'boolean') {
          const boolValue = value === 1 || value === true || value === '1' || value === 'true'
          const alignClass = alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : 'justify-start'
          return (
            <div className={`flex items-center ${alignClass}`}>
              {boolValue ? (
                <IconCheck className="size-4 text-green-600" />
              ) : (
                <IconX className="size-4 text-red-600" />
              )}
            </div>
          )
        }
        // For price type (stored as integer cents), show as decimal with 2 digits
        if (col.fieldType === 'price') {
          const cents =
            value === null || value === undefined || value === ''
              ? NaN
              : Number(value)
          const amount = isFinite(cents) ? (cents / 100).toFixed(2) : '-'
          return <div className={`${col.primary ? "font-mono font-medium" : "font-mono"} ${alignmentClass}`}>{amount}</div>
        }

        // For media_id in contractors, show logo image or placeholder
        if (col.name === 'media_id' && collection === 'contractors') {
          const mediaId = value
          if (mediaId) {
            // media_id is UUID, use admin files endpoint
            const imageUrl = `/api/altrp/v1/admin/files/${mediaId}`
            return (
              <div className="flex items-center justify-start">
                <img
                  src={imageUrl}
                  alt="Logo"
                  className="h-10 w-10 rounded object-cover"
                  onError={(e) => {
                    // Fallback to placeholder on error
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const placeholder = target.nextElementSibling as HTMLElement
                    if (placeholder) placeholder.style.display = 'flex'
                  }}
                />
                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center" style={{ display: 'none' }}>
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            )
          }
          return (
            <div className="flex items-center justify-start">
              <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          )
        }

        // For enum type, show label instead of value
        if (col.fieldType === 'enum' && col.enum) {
          const valueIndex = col.enum.values.indexOf(String(value))
          const label = valueIndex >= 0 ? col.enum.labels[valueIndex] : value || "-"
          return <div className={alignmentClass}>{label}</div>
        }

        // For relation fields, show label instead of value
        if (col.relation && relationData[col.name]) {
          const label = relationData[col.name][value] || value || "-"
          return <div className={alignmentClass}>{label}</div>
        }
        
        // For select fields, show label instead of value
        if (col.fieldType === 'select' && col.selectOptions) {
          // Normalize comparison: compare both as strings, case-insensitive
          const normalizedValue = String(value || '').toLowerCase().trim()
          const option = col.selectOptions.find(opt => {
            const optValue = String(opt.value || '').toLowerCase().trim()
            return optValue === normalizedValue
          })
          const displayValue = option ? option.label : value || "-"
          return <div className={alignmentClass}>{displayValue}</div>
        }
        
        // For JSON fields in taxonomy collection (title and category fields), extract translation by locale
        // Also handle title field in roles, expanses, and contractors collections
        if (col.fieldType === 'json' && ((collection === 'taxonomy' && (col.name === 'title' || col.name === 'category')) || (collection === 'roles' && col.name === 'title') || (collection === 'expanses' && col.name === 'title') || (collection === 'contractors' && col.name === 'title'))) {
          let jsonValue = value
          
          // If category is empty, try to extract it from data_in
          if (col.name === 'category' && (!jsonValue || jsonValue === '' || jsonValue === null)) {
            const rowData = row.original
            const dataIn = rowData?.data_in
            if (dataIn && typeof dataIn === 'string') {
              try {
                const dataInJson = JSON.parse(dataIn)
                if (dataInJson && typeof dataInJson === 'object' && dataInJson.category) {
                  jsonValue = dataInJson.category
                }
              } catch (e) {
                // data_in is not valid JSON, ignore
              }
            }
          }
          
          if (typeof jsonValue === 'string') {
            try {
              jsonValue = JSON.parse(jsonValue)
            } catch (e) {
              // If it's not valid JSON, treat as plain text (backward compatibility)
            }
          }
          if (jsonValue && typeof jsonValue === 'object') {
            const localeValue = jsonValue[locale] || jsonValue.en || jsonValue.ru || jsonValue.rs || null
            // If localeValue is an object with title and value structure, use the value for table/card body
            if (localeValue && typeof localeValue === 'object' && 'value' in localeValue) {
              const displayValue = localeValue.value != null ? String(localeValue.value) : "-"
              // Make title clickable for contractors to navigate to detail page
              if (collection === 'contractors' && col.name === 'title') {
                const caid = row.original.caid
                return (
                  <div 
                    className={`${alignmentClass} cursor-pointer hover:text-primary hover:underline`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (caid) {
                        window.location.href = `/admin/contractors/${caid}`
                      }
                    }}
                  >
                    {displayValue}
                  </div>
                )
              }
              return <div className={alignmentClass}>{displayValue}</div>
            } else if (localeValue !== null && localeValue !== undefined) {
              // If it's a simple value (string, number, etc.)
              // Make title clickable for contractors to navigate to detail page
              if (collection === 'contractors' && col.name === 'title') {
                const caid = row.original.caid
                return (
                  <div 
                    className={`${alignmentClass} cursor-pointer hover:text-primary hover:underline`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (caid) {
                        window.location.href = `/admin/contractors/${caid}`
                      }
                    }}
                  >
                    {String(localeValue)}
                  </div>
                )
              }
              return <div className={alignmentClass}>{String(localeValue)}</div>
            }
            // Make title clickable for contractors even when value is null
            if (collection === 'contractors' && col.name === 'title') {
              const caid = row.original.caid
              return (
                <div 
                  className={`${alignmentClass} cursor-pointer hover:text-primary hover:underline`}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (caid) {
                      window.location.href = `/admin/contractors/${caid}`
                    }
                  }}
                >
                  -
                </div>
              )
            }
            return <div className={alignmentClass}>-</div>
          }
        }
        
        // For taxonomy.entity field, translate using entityOptions
        if (collection === 'taxonomy' && col.name === 'entity' && value) {
          const entityOptions = (translations as any)?.taxonomy?.entityOptions || {}
          const translatedValue = entityOptions[value] || value
          return (
            <div className={`${col.primary ? "font-mono font-medium" : ""}`}>
              {translatedValue}
            </div>
          )
        }
        
        // Use defaultCell if value is empty/null/undefined
        const isEmpty = value === null || value === undefined || value === ''
        const displayValue = isEmpty && col.defaultCell !== undefined
          ? col.defaultCell
          : col.format 
            ? col.format(value, locale) 
            : formatCellValue(value)
        
        // For textarea fields, truncate text in table
        if (col.textarea) {
          const textValue = typeof displayValue === 'string' ? displayValue : String(displayValue || '')
          return (
            <div className={`${col.primary ? "font-mono font-medium" : ""} truncate max-w-[300px] ${alignmentClass}`} title={textValue}>
              {textValue || "-"}
            </div>
          )
        }
        
        return (
          <div className={`${col.primary ? "font-mono font-medium" : ""}`}>
            {displayValue}
          </div>
        )
      },
      }
    }),
    // Dynamic columns from data_in
    ...(data && columnVisibility ? (() => {
      // Get all unique base keys from data_in in all records
      const allDataInKeys = new Set<string>()
      data.forEach((row) => {
        const dataIn = row.data_in
        if (dataIn) {
          try {
            let parsed: any = dataIn
            if (typeof dataIn === 'string') {
              try {
                parsed = JSON.parse(dataIn)
              } catch (e) {
                return
              }
            }
            if (parsed && typeof parsed === 'object') {
              Object.keys(parsed).forEach((key) => {
                // Remove language suffix if present
                const langMatch = key.match(/^(.+)_([a-z]{2})$/i)
                if (langMatch && ['en', 'ru', 'rs'].includes(langMatch[2].toLowerCase())) {
                  allDataInKeys.add(langMatch[1])
                } else {
                  allDataInKeys.add(key)
                }
              })
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      })
      
      // Create columns only for visible data_in fields
      return Array.from(allDataInKeys)
        .filter((baseKey) => {
          const columnId = `data_in.${baseKey}`
          return columnVisibility[columnId] !== false
        })
        .map((baseKey) => {
          // Try to get title from data_in in first record that has this field
          let fieldTitle: string | null = null
          if (data && data.length > 0) {
            for (const row of data) {
              const dataIn = row.data_in
              if (dataIn) {
                try {
                  let parsed: any = dataIn
                  if (typeof dataIn === 'string') {
                    try {
                      parsed = JSON.parse(dataIn)
                    } catch (e) {
                      continue
                    }
                  }
                  if (parsed && typeof parsed === 'object') {
                    // Find the key (case-insensitive)
                    const foundKey = Object.keys(parsed).find(key => {
                      const langMatch = key.match(/^(.+)_([a-z]{2})$/i)
                      if (langMatch && langMatch[1].toLowerCase() === baseKey.toLowerCase()) {
                        return true
                      }
                      return key.toLowerCase() === baseKey.toLowerCase()
                    })
                    if (foundKey && parsed[foundKey] !== undefined) {
                      const value = parsed[foundKey]
                      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        const localeValue = value[locale] || value.en || value.ru || value.rs || null
                        if (localeValue !== null && localeValue !== undefined && typeof localeValue === 'object' && 'title' in localeValue) {
                          fieldTitle = localeValue.title || null
                          if (fieldTitle) break
                        }
                      }
                    }
                  }
                } catch (e) {
                  continue
                }
              }
            }
          }
          // Fallback to translation or baseKey
          // translations parameter is already the dataTable object, so use translations.fields directly
          const fieldTranslation = (translations as any)?.fields?.[collection || '']?.[baseKey]
          const columnTitle = fieldTitle || fieldTranslation || baseKey
          
          return {
            id: `data_in.${baseKey}`,
            accessorFn: (row: CollectionData) => {
              const dataIn = row.data_in
              if (dataIn) {
                try {
                  let parsed: any = dataIn
                  if (typeof dataIn === 'string') {
                    try {
                      parsed = JSON.parse(dataIn)
                    } catch (e) {
                      return null
                    }
                  }
                  if (parsed && typeof parsed === 'object') {
                    // Find the key (case-insensitive)
                    const foundKey = Object.keys(parsed).find(key => {
                      const langMatch = key.match(/^(.+)_([a-z]{2})$/i)
                      if (langMatch && langMatch[1].toLowerCase() === baseKey.toLowerCase()) {
                        return true
                      }
                      return key.toLowerCase() === baseKey.toLowerCase()
                    })
                    if (foundKey && parsed[foundKey] !== undefined) {
                      const value = parsed[foundKey]
                      // If value is an object with language keys
                      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        const localeValue = value[locale] || value.en || value.ru || value.rs || null
                        if (localeValue !== null && localeValue !== undefined) {
                          // Check if localeValue is an object with title and value structure
                          if (typeof localeValue === 'object' && 'value' in localeValue) {
                            return localeValue.value != null ? String(localeValue.value) : null
                          } else {
                            return String(localeValue)
                          }
                        }
                      } else if (value !== null && value !== undefined) {
                        return String(value)
                      }
                    }
                  }
                } catch (e) {
                  // Ignore parse errors
                }
              }
              return null
            },
            enableSorting: true,
            header: ({ column, table }: HeaderContext<CollectionData, unknown>) => {
              const sortedIndex = table.getState().sorting.findIndex((s: any) => s.id === column.id)
              const isSorted = column.getIsSorted()
              const hasMultipleSorts = table.getState().sorting.length > 1
              
              // Get alignment for this data_in column
              const columnId = `data_in.${baseKey}`
              const alignment = columnAlignment?.[columnId] || 'left'
              const isCentered = alignment === 'center'
              const isRight = alignment === 'right'
              const headerAlignClass = isCentered ? 'justify-center' : isRight ? 'justify-end' : 'justify-start'
              
              return (
                <Button
                  variant="ghost"
                  className={`h-auto p-0 hover:bg-transparent font-semibold ${headerAlignClass}`}
                  onClick={(e) => {
                    if (e.shiftKey) {
                      // Shift + click: add to multi-sort
                      column.toggleSorting(isSorted === "asc", true)
                    } else {
                      // Regular click: toggle sort (replaces existing sorts)
                      column.toggleSorting(isSorted === "asc")
                    }
                  }}
                  title={hasMultipleSorts ? (translations as any)?.dataTable?.sortTooltipMultiple || "Click: change sort | Shift+Click: add to sort" : (translations as any)?.dataTable?.sortTooltipSingle || "Click: sort | Shift+Click: add to sort"}
                >
                  <div className={`flex items-center gap-1 ${headerAlignClass}`}>
                    <span>{columnTitle}</span>
                    <span className="ml-1 flex items-center gap-0.5">
                      {isSorted ? (
                        <>
                          {isSorted === "asc" ? (
                            <IconArrowUp className="h-3 w-3" />
                          ) : (
                            <IconArrowDown className="h-3 w-3" />
                          )}
                          {sortedIndex >= 0 && hasMultipleSorts && (
                            <Badge variant="secondary" className="text-[9px] px-0 py-0 h-4 min-w-4 flex items-center justify-center font-semibold">
                              {sortedIndex + 1}
                            </Badge>
                          )}
                        </>
                      ) : (
                        <IconArrowsSort className="h-3 w-3 opacity-30" />
                      )}
                    </span>
                  </div>
                </Button>
              )
            },
            cell: ({ getValue, row }: { getValue: () => any; row: Row<CollectionData> }) => {
              // Get row ID for updates
              const primaryKey = fullSchema?.find((f: ColumnSchemaExtended) => f.primary)?.name || 'id'
              const rowId = row.original[primaryKey]
              const rowIdStr = String(rowId)
              
              // Check editedCells first for data_in
              const editedDataIn = editedCells?.get(rowIdStr)?.['data_in']
              let value = getValue()
              
              // If data_in was edited, extract value from edited data_in
              if (editedDataIn !== undefined) {
                try {
                  let parsed: any = editedDataIn
                  if (typeof editedDataIn === 'string') {
                    parsed = JSON.parse(editedDataIn)
                  }
                  
                  if (parsed && typeof parsed === 'object') {
                    const foundKey = Object.keys(parsed).find(key => {
                      const langMatch = key.match(/^(.+)_([a-z]{2})$/i)
                      if (langMatch && langMatch[1].toLowerCase() === baseKey.toLowerCase()) {
                        return true
                      }
                      return key.toLowerCase() === baseKey.toLowerCase()
                    })
                    
                    if (foundKey && parsed[foundKey] !== undefined) {
                      const fieldValue = parsed[foundKey]
                      if (typeof fieldValue === 'object' && fieldValue !== null && !Array.isArray(fieldValue)) {
                        const localeValue = fieldValue[locale] || fieldValue.en || fieldValue.ru || fieldValue.rs || null
                        if (localeValue !== null && localeValue !== undefined) {
                          if (typeof localeValue === 'object' && 'value' in localeValue) {
                            value = localeValue.value != null ? String(localeValue.value) : null
                          } else {
                            value = String(localeValue)
                          }
                        } else {
                          value = null
                        }
                      } else {
                        value = String(fieldValue)
                      }
                    }
                  }
                } catch (e) {
                  // Ignore parse errors, use original value
                }
              }
              
              // If value is still an object or JSON string, try to parse it
              // This can happen if data_in was already parsed as object but value wasn't extracted
              if (value && typeof value === 'object' && !Array.isArray(value)) {
                // Value is an object, try to extract locale value
                const localeValue = value[locale] || value.en || value.ru || value.rs || null
                if (localeValue !== null && localeValue !== undefined) {
                  if (typeof localeValue === 'object' && 'value' in localeValue) {
                    value = localeValue.value != null ? String(localeValue.value) : null
                  } else {
                    value = String(localeValue)
                  }
                } else {
                  value = null
                }
              } else if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
                // Value is a JSON string, try to parse it
                try {
                  const parsed = JSON.parse(value)
                  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    const localeValue = parsed[locale] || parsed.en || parsed.ru || parsed.rs || null
                    if (localeValue !== null && localeValue !== undefined) {
                      if (typeof localeValue === 'object' && 'value' in localeValue) {
                        value = localeValue.value != null ? String(localeValue.value) : null
                      } else {
                        value = String(localeValue)
                      }
                    } else {
                      value = null
                    }
                  }
                } catch (e) {
                  // Not valid JSON, use as is
                }
              }
              
              // Get alignment for this data_in column
              const columnId = `data_in.${baseKey}`
              const alignment = columnAlignment?.[columnId] || 'left'
              const alignmentClass = alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left'
              
              // Edit mode: return editable input for data_in fields
              if (editMode && handleCellUpdate && fullSchema) {
                const primaryKey = fullSchema.find((f: ColumnSchemaExtended) => f.primary)?.name || 'id'
                const rowId = row.original[primaryKey]
                const rowIdStr = String(rowId)
                
                // Get current data_in from editedCells or original
                const editedDataIn = editedCells?.get(rowIdStr)?.['data_in']
                const currentDataIn = editedDataIn !== undefined ? editedDataIn : row.original.data_in
                
                return (
                  <Input
                    type="text"
                    value={value ?? ''}
                    onChange={(e) => {
                      // Update data_in field - need to update entire data_in structure
                      let parsed: any = {}
                      
                      if (currentDataIn) {
                        try {
                          parsed = typeof currentDataIn === 'string' ? JSON.parse(currentDataIn) : currentDataIn
                        } catch (e) {
                          // Ignore
                        }
                      }
                      
                      // Update the value in the structure
                      // Try to find existing key (with or without language suffix)
                      const foundKey = Object.keys(parsed).find(key => {
                        const langMatch = key.match(/^(.+)_([a-z]{2})$/i)
                        if (langMatch && langMatch[1].toLowerCase() === baseKey.toLowerCase()) {
                          return true
                        }
                        return key.toLowerCase() === baseKey.toLowerCase()
                      })
                      
                      if (foundKey) {
                        // Update existing key
                        const existingValue = parsed[foundKey]
                        if (typeof existingValue === 'object' && existingValue !== null && !Array.isArray(existingValue)) {
                          // Update value in locale structure
                          const langMatch = foundKey.match(/^(.+)_([a-z]{2})$/i)
                          if (langMatch) {
                            // Key has language suffix, update that locale
                            const lang = langMatch[2].toLowerCase()
                            if (!existingValue[lang]) {
                              existingValue[lang] = {}
                            }
                            if (typeof existingValue[lang] === 'object' && 'value' in existingValue[lang]) {
                              existingValue[lang].value = e.target.value
                            } else {
                              existingValue[lang] = { value: e.target.value }
                            }
                          } else {
                            // No language suffix, update all locales
                            for (const lang of ['en', 'ru', 'rs']) {
                              if (!existingValue[lang]) {
                                existingValue[lang] = {}
                              }
                              if (typeof existingValue[lang] === 'object' && 'value' in existingValue[lang]) {
                                existingValue[lang].value = e.target.value
                              } else {
                                existingValue[lang] = { value: e.target.value }
                              }
                            }
                          }
                        } else {
                          // Simple value, update directly
                          parsed[foundKey] = e.target.value
                        }
                      } else {
                        // Create new key with locale structure
                        const langObject: Record<string, { value: string }> = {}
                        for (const lang of ['en', 'ru', 'rs']) {
                          langObject[lang] = { value: e.target.value }
                        }
                        parsed[baseKey] = langObject
                      }
                      
                      // Update entire data_in in local state
                      handleCellUpdate(rowId, 'data_in', parsed)
                    }}
                    className="h-8 text-xs"
                  />
                )
              }
              
              return <div className={alignmentClass}>{value || '-'}</div>
            },
          }
        })
    })() : []),
  {
    id: "actions",
    enableResizing: false,
    size: 40,
    minSize: 40,
    maxSize: 40,
    cell: ({ row }) => (
      <div className="flex items-center justify-center p-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <IconDotsVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => onEditRequest(row)}>{translations?.actions?.edit || "Edit"}</DropdownMenuItem>
              {onDuplicateRequest && (
                <DropdownMenuItem onClick={() => onDuplicateRequest(row)}>
                  {translations?.actions?.duplicate || "Duplicate"}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => onDeleteRequest(row)}>
                {translations?.delete?.delete || "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
]
}

export function DataTable() {
  const { state, setState } = useAdminState()
  const { user } = useMe()
  type LanguageCode = (typeof LANGUAGES)[number]["code"]
  const supportedLanguageCodes = React.useMemo(
    () => LANGUAGES.map((l) => l.code),
    []
  )
  
  // Get primary role from user
  const primaryRole = React.useMemo(() => {
    if (!user?.roles || user.roles.length === 0) return null
    // Use first role, or role with highest order if available
    return user.roles[0]?.name || null
  }, [user])

  const [locale, setLocale] = React.useState<LanguageCode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar-locale")
      if (saved && supportedLanguageCodes.includes(saved as LanguageCode)) {
        return saved as LanguageCode
      }
    }
    const defaultLang = PROJECT_SETTINGS.defaultLanguage
    if (supportedLanguageCodes.includes(defaultLang as LanguageCode)) {
      return defaultLang as LanguageCode
    }
    return LANGUAGES[0]?.code || ("en" as LanguageCode)
  })

  const [data, setData] = React.useState<CollectionData[]>([])
  const [schema, setSchema] = React.useState<ColumnSchemaExtended[]>([])
  const [total, setTotal] = React.useState(0)
  const [totalPages, setTotalPages] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [relationData, setRelationData] = React.useState<Record<string, Record<any, string>>>({})
  const [translations, setTranslations] = React.useState<any>(null)
  const [taxonomyConfig, setTaxonomyConfig] = React.useState<any>(null)
  const [segmentStatuses, setSegmentStatuses] = React.useState<SelectOption[]>([])
  
  // Local search state for input (debounced before updating global state)
  const [searchInput, setSearchInput] = React.useState(state.search)
  // Parsed search conditions with badges (only created on Enter press)
  const [searchConditions, setSearchConditions] = React.useState<SearchCondition[]>([])
  
  // Local state for price inputs to allow free input without formatting interference
  const [priceInputs, setPriceInputs] = React.useState<Record<string, string>>({})

  // Form tabs and data_in state
  const [createFormTab, setCreateFormTab] = React.useState<"main" | "info" | "details">("main")
  const [editFormTab, setEditFormTab] = React.useState<"main" | "info" | "details">("main")
  const [createDataInLanguage, setCreateDataInLanguage] = React.useState<LanguageCode>(locale)
  const [editDataInLanguage, setEditDataInLanguage] = React.useState<LanguageCode>(locale)
  const [createDataInEntries, setCreateDataInEntries] = React.useState<Array<{ key: string; title: string; value: string }>>([])
  const [editDataInEntries, setEditDataInEntries] = React.useState<Array<{ key: string; title: string; value: string }>>([])
  // Temporary key values for input fields to prevent re-renders during typing
  const [createKeyInputs, setCreateKeyInputs] = React.useState<Record<string, string>>({})
  const [editKeyInputs, setEditKeyInputs] = React.useState<Record<string, string>>({})
  // Temporary title and value inputs to prevent re-renders during typing
  const [createTitleInputs, setCreateTitleInputs] = React.useState<Record<string, string>>({})
  const [createValueInputs, setCreateValueInputs] = React.useState<Record<string, string>>({})
  const [editTitleInputs, setEditTitleInputs] = React.useState<Record<string, string>>({})
  const [editValueInputs, setEditValueInputs] = React.useState<Record<string, string>>({})
  // Column visibility state for columns tab
  const [visibleColumns, setVisibleColumns] = React.useState<Set<string>>(new Set())
  
  // Sync visibleColumns with columnVisibility when changed
  React.useEffect(() => {
    if (visibleColumns.size > 0) {
      const newVisibility: VisibilityState = {}
      // Set all columns to hidden first
      schema.forEach(col => {
        if (!col.primary && col.name !== 'data_in') {
          newVisibility[col.name] = visibleColumns.has(col.name)
        }
      })
      // Handle data_in columns
      const allDataInKeys = new Set<string>()
      createDataInEntries.forEach(e => {
        const langMatch = e.key.match(/^(.+)_([a-z]{2})$/i)
        if (langMatch) {
          allDataInKeys.add(langMatch[1])
        } else {
          allDataInKeys.add(e.key)
        }
      })
      editDataInEntries.forEach(e => {
        const langMatch = e.key.match(/^(.+)_([a-z]{2})$/i)
        if (langMatch) {
          allDataInKeys.add(langMatch[1])
        } else {
          allDataInKeys.add(e.key)
        }
      })
      allDataInKeys.forEach(key => {
        newVisibility[`data_in.${key}`] = visibleColumns.has(`data_in.${key}`)
      })
      setColumnVisibility(newVisibility)
    }
  }, [visibleColumns, schema, createDataInEntries, editDataInEntries])
  const [createDataInRaw, setCreateDataInRaw] = React.useState<string>("")
  const [editDataInRaw, setEditDataInRaw] = React.useState<string>("")
  const [createDataInRawError, setCreateDataInRawError] = React.useState<string | null>(null)
  const [editDataInRawError, setEditDataInRawError] = React.useState<string | null>(null)

  // Data_in helper functions
  const parseLooseJson = React.useCallback((input: string): any => {
    const s = String(input ?? "").trim()
    if (!s) return ""
    // Try to parse JSON primitives/objects/arrays; fallback to string
    try {
      return JSON.parse(s)
    } catch {
      return s
    }
  }, [])

  const entriesToObject = React.useCallback((entries: Array<{ key: string; title: string; value: string }>) => {
    // This function is used for raw JSON sync, but we should use entriesToLanguageObject instead
    // Keeping for backward compatibility but it will be replaced
    const obj: Record<string, any> = {}
    entries.forEach((e) => {
      const k = String(e.key || "").trim()
      if (!k) return
      obj[k] = parseLooseJson(e.value)
    })
    return obj
  }, [parseLooseJson])

  const entriesToLanguageObject = React.useCallback((entries: Array<{ key: string; title: string; value: string }>) => {
    const obj: Record<string, any> = {}
    const languageFields: Record<string, Record<string, { title: string; value: any }>> = {}
    const plainFields: Record<string, any> = {}
    
    for (const entry of entries) {
      const langMatch = entry.key.match(/^(.+)_([a-z]{2})$/i)
      if (langMatch && supportedLanguageCodes.includes(langMatch[2].toLowerCase() as LanguageCode)) {
        const fieldName = langMatch[1]
        const lang = langMatch[2].toLowerCase()
        if (!languageFields[fieldName]) {
          languageFields[fieldName] = {}
        }
        languageFields[fieldName][lang] = {
          title: entry.title || '',
          value: parseLooseJson(entry.value)
        }
      } else {
        plainFields[entry.key] = parseLooseJson(entry.value)
      }
    }
    
    // Add language fields as objects with title and value structure
    for (const [fieldName, langValues] of Object.entries(languageFields)) {
      obj[fieldName] = langValues
    }
    
    // Add plain fields (without language suffix)
    for (const [key, value] of Object.entries(plainFields)) {
      obj[key] = value
    }
    
    return obj
  }, [parseLooseJson, supportedLanguageCodes])

  const objectToEntries = React.useCallback((obj: any) => {
    if (!obj || typeof obj !== "object") return [] as Array<{ key: string; title: string; value: string }>
    const entries: Array<{ key: string; title: string; value: string }> = []
    
    for (const [k, v] of Object.entries(obj)) {
      // Check if value is an object with language keys (en, ru, rs)
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        const langObj = v as Record<string, any>
        // Check if it looks like a language object (has keys like 'en', 'ru', 'rs')
        const langKeys = Object.keys(langObj).filter(key => ['en', 'ru', 'rs'].includes(key.toLowerCase()))
        if (langKeys.length > 0) {
          // Expand language object into separate entries for each language
          for (const [lang, langValue] of Object.entries(langObj)) {
            if (['en', 'ru', 'rs'].includes(lang.toLowerCase())) {
              // Check if langValue is an object with title and value
              if (langValue && typeof langValue === 'object' && !Array.isArray(langValue) && ('title' in langValue || 'value' in langValue)) {
                entries.push({
                  key: `${k}_${lang.toLowerCase()}`,
                  title: langValue.title || '',
                  value: langValue.value != null ? String(langValue.value) : '',
                })
              } else {
                // Legacy format: just a string value
                entries.push({
                  key: `${k}_${lang.toLowerCase()}`,
                  title: '',
                  value: typeof langValue === 'string' ? langValue : String(langValue || ''),
                })
              }
            }
          }
          continue
        }
      }
      
      // Regular entry (not a language object)
      entries.push({
      key: k,
        title: '',
      value: typeof v === "string" ? v : JSON.stringify(v),
      })
    }
    
    return entries
  }, [])

  // Helper function to get unique base keys from entries (without language suffix)
  const getUniqueBaseKeys = React.useCallback((entries: Array<{ key: string; title: string; value: string }>): string[] => {
    const baseKeys = new Set<string>()
    for (const entry of entries) {
      const langMatch = entry.key.match(/^(.+)_([a-z]{2})$/i)
      if (langMatch && supportedLanguageCodes.includes(langMatch[2].toLowerCase() as LanguageCode)) {
        baseKeys.add(langMatch[1])
      } else {
        baseKeys.add(entry.key)
      }
    }
    return Array.from(baseKeys)
  }, [supportedLanguageCodes])

  // Helper function to get title and value for a specific language from entries
  const getTitleAndValueForLanguage = React.useCallback((entries: Array<{ key: string; title: string; value: string }>, baseKey: string, lang: LanguageCode): { title: string; value: string } => {
    const langKey = `${baseKey}_${lang}`
    const entry = entries.find(e => e.key === langKey)
    return {
      title: entry?.title || '',
      value: entry?.value || ''
    }
  }, [])

  // Helper function to update title and value for a specific language in entries
  const updateTitleAndValueForLanguage = React.useCallback((entries: Array<{ key: string; title: string; value: string }>, baseKey: string, lang: LanguageCode, title: string, value: string, duplicateToAll: boolean = false): Array<{ key: string; title: string; value: string }> => {
    const langKey = `${baseKey}_${lang}`
    
    if (duplicateToAll) {
      // Remove existing entries for this base key and add entries for all languages
      const filtered = entries.filter(e => {
        const langMatch = e.key.match(/^(.+)_([a-z]{2})$/i)
        if (langMatch && langMatch[1] === baseKey) {
          return false
        }
        return e.key !== baseKey
      })
      
      // Add entries for all languages with the same title and value
      const newEntries = supportedLanguageCodes.map((l) => ({
        key: `${baseKey}_${l}`,
        title: title,
        value: value,
      }))
      return [...filtered, ...newEntries]
    } else {
      // Update only the current language entry, keep others unchanged to avoid re-renders
      const result = entries.map(e => {
        if (e.key === langKey) {
          return { ...e, title: title, value: value }
        }
        return e
      })
      
      // If entry doesn't exist, add it
      const exists = result.some(e => e.key === langKey)
      if (!exists) {
        result.push({ key: langKey, title: title, value: value })
      }
      
      return result
    }
  }, [supportedLanguageCodes])

  // Load Taxonomy config when collection is taxonomy
  React.useEffect(() => {
    if (state.collection === 'taxonomy' && typeof window !== 'undefined') {
      import('../../../../app/src/collections/Taxonomy').then((module) => {
        setTaxonomyConfig(module.Taxonomy)
      }).catch((e) => {
        console.error('[DataTable] Failed to load Taxonomy config:', e)
      })
    } else {
      setTaxonomyConfig(null)
    }
  }, [state.collection])

  // Sync locale with sidebar when it changes
  React.useEffect(() => {
    const handleLocaleChanged = (e: StorageEvent | CustomEvent) => {
      const newLocale = (e as CustomEvent).detail || (e as StorageEvent).newValue
      if (newLocale && supportedLanguageCodes.includes(newLocale as LanguageCode)) {
        setLocale(newLocale as LanguageCode)
      }
    }

    // Listen to localStorage changes
    window.addEventListener('storage', handleLocaleChanged as EventListener)
    // Listen to custom event from sidebar
    window.addEventListener('sidebar-locale-changed', handleLocaleChanged as EventListener)

    return () => {
      window.removeEventListener('storage', handleLocaleChanged as EventListener)
      window.removeEventListener('sidebar-locale-changed', handleLocaleChanged as EventListener)
    }
  }, [supportedLanguageCodes])

  // Load translations
  React.useEffect(() => {
    const loadTranslations = async () => {
      try {
        const cacheKey = `sidebar-translations-${locale}`
        const cached = typeof window !== 'undefined' ? sessionStorage.getItem(cacheKey) : null
        
        if (cached) {
          try {
            const cachedTranslations = JSON.parse(cached)
            setTranslations(cachedTranslations)
            // Continue to fetch fresh translations in background to ensure we have latest
            // Don't return here, let it fetch fresh data
          } catch (e) {
            console.error('[DataTable] Failed to parse cached translations:', e)
            // If parsing fails, proceed with fetch
          }
        }
        
        const response = await fetch(`/api/locales/${locale}`)
        if (!response.ok) {
          throw new Error(`Failed to load translations: ${response.status}`)
        }
        const translationsData = await response.json() as any

        setTranslations(translationsData)
        
        // Cache translations
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(cacheKey, JSON.stringify(translationsData))
        }
      } catch (e) {
        console.error('[DataTable] Failed to load translations:', e)
        // Fallback to direct import
        try {
          try {
            const translationsModule = await import(`@/packages/content/locales/${locale}.json`)
            setTranslations(translationsModule.default || translationsModule)
          } catch {
            const translationsModule = await import("@/packages/content/locales/en.json")
            setTranslations(translationsModule.default || translationsModule)
          }
        } catch (fallbackError) {
          console.error('Fallback import also failed:', fallbackError)
        }
      }
    }
    
    loadTranslations()
  }, [locale])

  const t = React.useMemo(() => {
    const dataTableTranslations = (translations as any)?.dataTable
    if (!dataTableTranslations) {
      console.warn('[DataTable] Using fallback translations, translations not loaded yet')
    }
    return dataTableTranslations || defaultT
  }, [translations])

  const collectionToEntityKey = React.useCallback((collection: string): string => {
    const normalized = (collection || "").toLowerCase()
    const specialCases: Record<string, string> = {
      echelon_employees: "employee_echelon",
      product_variants: "product_variant",
      asset_variants: "asset_variant",
      text_variants: "text_variant",
      wallet_transactions: "wallet_transaction",
      base_moves: "base_move",
      base_move_routes: "base_move_route",
      message_threads: "message_thread",
      outreach_referrals: "outreach_referral",
      echelons: "employee_echelon",
      employee_timesheets: "employee_timesheet",
      employee_leaves: "employee_leave",
      journal_generations: "journal_generation",
      journal_connections: "journal_connection",
      user_sessions: "user_session",
      user_bans: "user_ban",
      user_verifications: "user_verification",
      role_permissions: "role_permission",
      roles: "role",
    }
    const mapped = specialCases[normalized] || normalized
    if (mapped.endsWith("ies")) return mapped.slice(0, -3) + "y"
    if (mapped.endsWith("es") && !mapped.endsWith("ses")) return mapped.slice(0, -2)
    if (mapped.endsWith("s")) return mapped.slice(0, -1)
    return mapped
  }, [])

  const collectionLabel = React.useMemo(() => {
    const entityOptions = (translations as any)?.taxonomy?.entityOptions || {}
    const key = collectionToEntityKey(state.collection)
    return entityOptions[key] || state.collection
  }, [state.collection, translations, collectionToEntityKey])
  
  

  const primaryKey = React.useMemo(() => schema.find((c) => c.primary)?.name || "id", [schema])

  // Memoize filters string to prevent unnecessary re-renders
  const filtersString = React.useMemo(() => JSON.stringify(state.filters), [state.filters])
  
  // Use ref for searchConditions to avoid dependency issues
  const searchConditionsRef = React.useRef(searchConditions)
  React.useEffect(() => {
    searchConditionsRef.current = searchConditions
  }, [searchConditions])

  // Track fetching state to prevent concurrent requests
  const isFetchingRef = React.useRef(false)

  // Load segment statuses from taxonomy for expanses.status_name
  const loadSegmentStatuses = React.useCallback(async () => {
    try {
      const filters = {
        conditions: [
          {
            field: 'entity',
            operator: 'eq',
            values: ['Segment'],
          },
        ],
      }
      const orders = {
        orders: [{ field: 'sortOrder', direction: 'asc' }],
      }
      // Build query params manually to ensure proper encoding
      const params = new URLSearchParams()
      params.append('filters', JSON.stringify(filters))
      params.append('orders', JSON.stringify(orders))
      params.append('limit', '1000')
      
      const response = await fetch(`/api/admin/taxonomies?${params.toString()}`, {
        credentials: 'include',
      })
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[DataTable] Failed to load segment statuses:', response.status, errorText)
        throw new Error(`Failed to load statuses: ${response.status}`)
      }
      
      const data = await response.json() as { docs?: Array<{ name?: string; title?: string | Record<string, string>; sortOrder?: number }> }
      const options: SelectOption[] = (data.docs || []).map((status: any) => {
        // Extract localized label from title
        let label = status.name || ''
        if (status.title) {
          const title = typeof status.title === 'string' 
            ? JSON.parse(status.title) 
            : status.title
          label = title[locale] || title.en || title.ru || title.rs || status.name
        }
        return {
          value: status.name || '',
          label: label,
        }
      })
      setSegmentStatuses(options)
    } catch (e) {
      console.error('Failed to load segment statuses:', e)
      setSegmentStatuses([])
    }
  }, [locale])

  // Load segment statuses when collection is expanses or when locale changes
  React.useEffect(() => {
    if (state.collection === 'expanses') {
      void loadSegmentStatuses()
    } else {
      // Clear statuses when not on expanses collection
      setSegmentStatuses([])
    }
  }, [state.collection, loadSegmentStatuses])

  // Update schema when segmentStatuses change for expanses (to update selectOptions and fieldType)
  const segmentStatusesStrRef = React.useRef<string>('')
  
  React.useEffect(() => {
    if (state.collection === 'expanses') {
      const currentStatusesStr = JSON.stringify(segmentStatuses)
      
      // Check if segmentStatuses actually changed
      if (currentStatusesStr === segmentStatusesStrRef.current) {
        return // No change, skip update
      }
      
      segmentStatusesStrRef.current = currentStatusesStr
      
      // Update schema with new selectOptions for status_name and ensure title is json
      setSchema((prevSchema) => {
        if (prevSchema.length === 0) return prevSchema
        
        const updatedSchema = prevSchema.map((col) => {
          if (col.name === 'status_name' && segmentStatuses.length > 0) {
            return {
              ...col,
              selectOptions: segmentStatuses,
              fieldType: 'select' as const,
            }
          }
          // Also ensure title has fieldType: 'json' for expanses
          if (col.name === 'title' && col.fieldType !== 'json') {
            return {
              ...col,
              fieldType: 'json' as const,
            }
          }
          return col
        })
        
        // Only update if something changed
        const hasChanges = updatedSchema.some((col, index) => {
          const oldCol = prevSchema[index]
          return col.fieldType !== oldCol.fieldType || 
                 JSON.stringify(col.selectOptions) !== JSON.stringify(oldCol.selectOptions)
        })
        
        return hasChanges ? updatedSchema : prevSchema
      })
    }
  }, [segmentStatuses, state.collection])

  const fetchData = React.useCallback(async (abortSignal?: AbortSignal, isMountedRef?: { current: boolean }) => {
    setLoading(true)
    setError(null)
    try {
      // Check if search has operators - if yes, don't send to server (filter client-side)
      // Also need to load all data (no pagination limit) when filtering client-side
      const hasSearchOperators = searchConditionsRef.current.some(c => c.operator)
      const serverSearch = hasSearchOperators ? undefined : state.search
      // When filtering client-side, load all data (use large page size)
      const serverPageSize = hasSearchOperators ? 10000 : state.pageSize
      const serverPage = hasSearchOperators ? 1 : state.page

      const queryParams = qs.stringify({
        c: state.collection,
        p: serverPage,
        ps: serverPageSize,
        ...(serverSearch && { s: serverSearch }),
        ...(state.filters.length > 0 && { filters: state.filters }),
      }, {
        arrayFormat: 'brackets',
        encode: false,
      })

      const res = await fetch(`/api/admin/state?${queryParams}`, {
        signal: abortSignal,
        credentials: "include",
      })
      

      if (isMountedRef && !isMountedRef.current) return
      
      if (!res.ok) {
        let errorText = ''
        let errorJson: any = null
        try {
          const contentType = res.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            errorJson = await res.json()
            errorText = JSON.stringify(errorJson, null, 2)
          } else {
            errorText = await res.text()
          }
        } catch (e) {
          errorText = `Failed to read error response: ${e}`
        }
        
        console.error('[DataTable] Fetch error details:', {
          status: res.status,
          statusText: res.statusText,
          url: res.url,
          errorText,
          errorJson,
          queryParams,
        })
        
        const errorMessage = errorJson?.error || errorJson?.details?.message || `Failed to load: ${res.status}`
        throw new Error(errorMessage)
      }
      
      let json: StateResponse
      try {
        json = await res.json()
      } catch (parseError) {
        console.error('[DataTable] Failed to parse JSON response:', parseError)
        throw new Error('Invalid JSON response from server')
      }
      
      if (!json.success) {
        console.error('[DataTable] API returned unsuccessful response:', json)
        throw new Error(json.error || 'Failed to load data')
      }

      if (isMountedRef && !isMountedRef.current) return
      
      // Get collection config and apply column settings
      const collection = getCollection(state.collection)

      const inferFieldTypeFromDbType = (dbType: string | undefined): ColumnSchemaExtended["fieldType"] | undefined => {
        const t = (dbType || "").toUpperCase()
        if (!t) return undefined
        if (t === "JSON" || t === "JSONB") return "json"
        if (t === "BOOLEAN") return "boolean"
        if (t === "DATE") return "date"
        if (t.startsWith("TIMESTAMP")) return "datetime"
        if (t === "TIME") return "time"
        if (t === "INTEGER" || t === "BIGINT" || t === "SMALLINT") return "number"
        if (t === "NUMERIC" || t === "DECIMAL" || t === "REAL" || t === "DOUBLE PRECISION") return "number"
        return "text"
      }
      
      let extendedColumns: ColumnSchemaExtended[] = json.schema.columns.map((col) => {
        // Get BaseColumn directly from collection instance
        const fieldColumn = (collection as any)[col.name] as BaseColumn | undefined
        const options = fieldColumn?.options || {}
        
        // For taxonomy collection, get config from Taxonomy export
        let fieldConfig: any = null
        if (state.collection === 'taxonomy' && taxonomyConfig?.fields) {
          fieldConfig = taxonomyConfig.fields.find((f: any) => f.name === col.name)
        }
        
        // Hide system fields in table (data_in should be visible/editable via separate tab)
        const isSystemField = ['deleted_at', 'uuid'].includes(col.name)
        
        // Extract select options if field is select type
        let selectOptions: SelectOption[] | undefined
        if (fieldConfig?.type === 'select' && fieldConfig?.options?.length) {
          // Use translated options if available
          const entityOptions = (translations as any)?.taxonomy?.entityOptions || {}
          selectOptions = fieldConfig.options.map((opt: any) => {
            const value = opt.value || opt
            const translatedLabel = entityOptions[value] || opt.label || value
            return {
              label: translatedLabel,
              value: String(value),
            }
          })
        } else if ((options as any).type === 'select' && (options as any).selectOptions?.length) {
          selectOptions = (options as any).selectOptions.map((opt: any) => ({
            label: opt.label || opt.value,
            value: opt.value || opt,
          }))
        }
        
        // For expanses.status_name, load statuses from taxonomy (entity='Segment')
        if (state.collection === 'expanses' && col.name === 'status_name' && segmentStatuses && segmentStatuses.length > 0) {
          selectOptions = segmentStatuses
        }
        
        // Get translated field title
        let fieldTitle: string | undefined
        if (state.collection === 'taxonomy' && (translations as any)?.taxonomy?.fields) {
          const taxonomyFields = (translations as any).taxonomy.fields
          // Map sort_order to sortOrder for translation key
          const translationKey = col.name === 'sort_order' ? 'sortOrder' : col.name
          const fieldKey = translationKey as keyof typeof taxonomyFields
          fieldTitle = taxonomyFields[fieldKey]
        }

        // translations parameter is already the dataTable object, not the full translations object
        const dataTableFieldTitle =
          (translations as any)?.fields?.[state.collection]?.[col.name] as string | undefined
        if (dataTableFieldTitle) {
          fieldTitle = dataTableFieldTitle
        }
        
        // Explicit fallback for xaid in roles collection
        if (!fieldTitle && state.collection === 'roles' && col.name === 'xaid') {
          if (locale === 'ru') {
            fieldTitle = 'Проекты'
          } else if (locale === 'rs') {
            fieldTitle = 'Projekti'
          } else {
            fieldTitle = 'Expanse'
          }
          console.warn('[DataTable] Using hardcoded fallback for roles.xaid, translations available:', !!translations?.fields?.roles)
        }
        
        // Capitalize first letter and replace underscores with spaces
        const defaultTitle = col.name.charAt(0).toUpperCase() + col.name.slice(1).replace(/_/g, ' ')
        
        const inferredDbFieldType = inferFieldTypeFromDbType((col as any).type)
        const forcedFieldType =
          col.name === "data_in"
            ? "json"
            : (state.collection === "taxonomy" && col.name === "title") ||
              (state.collection === "roles" && col.name === "title") ||
              (state.collection === "expanses" && col.name === "title") ||
              (state.collection === "contractors" && col.name === "title")
            ? "json"
            : undefined

        const forcedRelation: RelationConfig | undefined =
          col.name === "xaid" && state.collection !== "expanses"
            ? {
                collection: "expanses",
                valueField: "xaid",
                labelField: "title",
              }
            : undefined

        const isSystemFieldByName = ['deleted_at', 'uuid'].includes(col.name)

        // Force select type if selectOptions are available (e.g., for expanses.status_name)
        const shouldBeSelect = selectOptions && selectOptions.length > 0

        // For contractors, ensure ID is visible in table (even if it's primary)
        const shouldHideInTable = options.hiddenTable || isSystemFieldByName || col.name === 'data_in' || (state.collection === 'roles' && col.name === 'raid') || (state.collection === 'expanses' && col.name === 'xaid') || (state.collection === 'contractors' && col.name === 'xaid')
        // Explicitly show ID for contractors, even if it's primary or would otherwise be hidden
        // Also ensure it's not hidden through options.hidden
        const hideInTable = (state.collection === 'contractors' && col.name === 'id') ? false : shouldHideInTable
        const isHidden = (state.collection === 'contractors' && col.name === 'id') ? false : (options.hidden || false)

        const finalRelation = forcedRelation || options.relation
        
        // Debug log for contractors relation fields
        if (state.collection === 'contractors' && (col.name === 'status_name' || col.name === 'city_name')) {
          console.log(`[DataTable fetchData] Contractors field ${col.name}:`, {
            hasOptions: !!options,
            hasRelation: !!options.relation,
            relation: options.relation,
            finalRelation,
            forcedRelation,
            willBeInSchema: !isHidden && !hideInTable,
          })
        }
        
        return {
          ...col,
          title: fieldTitle || options.title || defaultTitle,
          hidden: isHidden, // Hide only core system fields, but show ID for contractors
          hiddenTable: hideInTable, // Hide only core system fields, data_in, raid for roles, xaid for expanses and contractors, but show ID for contractors
          readOnly: options.readOnly || false,
          required: options.required || fieldConfig?.required || false,
          virtual: options.virtual || false,
          fieldType:
            shouldBeSelect
              ? 'select'
              : forcedFieldType ||
                options.type ||
                fieldConfig?.type ||
                inferredDbFieldType,
          textarea: options.textarea || false,
          enum: options.enum,
          relation: finalRelation,
          selectOptions,
        }
      })
      
      // Note: Column reordering for contractors (ID first) is now handled in reorderedColumns useMemo
      // to respect saved column order from localStorage
      
      // Load relation data for display
      const relationsToLoad = extendedColumns.filter(col => col.relation)
      const relationDataMap: Record<string, Record<any, string>> = {}
      
      for (const col of relationsToLoad) {
        if (!col.relation) continue
        if (isMountedRef && !isMountedRef.current) break

        
        try {
          // Limit relation fetch to only values actually used in current page data
          const valuesInUse = Array.from(
            new Set(
              (json.data || [])
                .map((row: any) => row[col.name])
                .filter((v: any) => v !== null && v !== undefined && v !== "")
            )
          )

          // Compose relation filters: defaults from schema + limit to values in current page
          const relationFilters: AdminFilter[] = []
          if (Array.isArray(col.relation.filters)) {
            relationFilters.push(...col.relation.filters)
          }
          if (valuesInUse.length > 0) {
            relationFilters.push({ field: col.relation.valueField, op: 'in', value: valuesInUse.join(',') })
          }

          const queryParams = qs.stringify({
            c: col.relation.collection,
            p: 1,
            ps: 1000,
            ...(col.relation.inheritSearch && state.search && { s: state.search }),
            ...(relationFilters.length > 0 && { filters: relationFilters }),
          })
          
          const relRes = await fetch(`/api/admin/state?${queryParams}`, {
            signal: abortSignal,
            credentials: "include",
          })
          
          if (isMountedRef && !isMountedRef.current) break
          
          if (relRes.ok) {
            const relJson: StateResponse = await relRes.json()
            const map: Record<any, string> = {}
            
            relJson.data.forEach((item) => {
              const value = item[col.relation!.valueField]
              let label: string
              
              // If labelField is 'title' and collection is 'taxonomy', parse JSON
              if (col.relation!.collection === 'taxonomy' && col.relation!.labelField === 'title') {
                let titleValue = item[col.relation!.labelField]
                
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
                label = col.relation!.labelFields
                  ? col.relation!.labelFields.map(f => item[f]).filter(Boolean).join(" ")
                  : String(item[col.relation!.labelField] || "-")
              }
              
              map[value] = label
            })
            
            relationDataMap[col.name] = map
          }
        } catch (e) {
          // Ignore AbortError for relation fetches
          if ((e as any)?.name !== "AbortError") {
            console.error(`Failed to load relation data for ${col.name}:`, e)
          }
        }
      }
      
      // Final mount check before state updates

      if (isMountedRef && !isMountedRef.current) return
      
      setRelationData(relationDataMap)
      
      // Update local state - only update collection and filters from API
      // NEVER update pageSize, page, or search from API response to prevent infinite loops
      // These values are controlled by UI state and should not be overwritten
      setState((prev) => {
        const newState: Partial<typeof prev> = {}
        let hasChanges = false
        
        // Only update collection if it changed
        if (json.state.collection !== prev.collection) {
          newState.collection = json.state.collection
          hasChanges = true
        }
        
        // Only update filters if they changed
        if (JSON.stringify(json.state.filters) !== JSON.stringify(prev.filters)) {
          newState.filters = json.state.filters
          hasChanges = true
        }
        
        // DO NOT update pageSize, page, or search from API
        // They are controlled by UI and updating them causes infinite loops
        
        if (!hasChanges) {
          return prev // Return same reference if nothing changed
        }
        return { ...prev, ...newState }
      })
      setSchema(extendedColumns)
      // When filtering client-side, total will be updated after filtering
      if (!hasSearchOperators) {
      setTotal(json.schema.total)
      setTotalPages(json.schema.totalPages)
      }
      setData(json.data)
    } catch (e) {
      // Ignore AbortError - it's expected when component unmounts
      if (isMountedRef && !isMountedRef.current) return
      if ((e as any)?.name !== "AbortError") {
        const errorMessage = e instanceof Error ? e.message : String(e)
        setError(errorMessage)
        console.error('[DataTable] Fetch error:', errorMessage, e)
        // Reset lastFetchParamsRef on error to allow retry
        const hasSearchOperators = searchConditionsRef.current.some(c => c.operator)
        const currentFetchKey = `${state.collection}-${state.page}-${hasSearchOperators ? '10000' : state.pageSize}-${state.search}-${filtersString}`
        if (lastFetchParamsRef.current === currentFetchKey) {
          lastFetchParamsRef.current = ''
        }
      }
    } finally {
      // Always reset fetching flag, even if component unmounted
      isFetchingRef.current = false
      if (!isMountedRef || isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [state.collection, state.page, state.pageSize, state.search, filtersString, setState, taxonomyConfig, translations, segmentStatuses, locale])

  // Track last fetch parameters to prevent unnecessary refetches
  const lastFetchParamsRef = React.useRef<string>('')
  const fetchDataRef = React.useRef(fetchData)
  
  // Keep fetchDataRef in sync
  React.useEffect(() => {
    fetchDataRef.current = fetchData
  }, [fetchData])
  
  // Reset fetching state on collection change to prevent stuck state
  React.useEffect(() => {
    isFetchingRef.current = false
    lastFetchParamsRef.current = ''
  }, [state.collection])
  
  React.useEffect(() => {
    // Don't fetch if collection is not set
    if (!state.collection) {
      //console.log('[DataTable] Skipping fetch: no collection')
      return
    }
    
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      //console.log('[DataTable] Skipping fetch: already fetching')
      return
    }
    
    const controller = new AbortController()
    const isMounted = { current: true }
    
    // Create a key for current fetch parameters
    const hasSearchOperators = searchConditionsRef.current.some(c => c.operator)
    const fetchKey = `${state.collection}-${state.page}-${hasSearchOperators ? '10000' : state.pageSize}-${state.search}-${filtersString}`
    
    // Skip if parameters haven't changed
    if (lastFetchParamsRef.current === fetchKey && lastFetchParamsRef.current !== '') {
      //console.log('[DataTable] Skipping fetch: parameters unchanged', { fetchKey, lastFetch: lastFetchParamsRef.current })
      return
    }
    
    lastFetchParamsRef.current = fetchKey
    isFetchingRef.current = true
    
    // Use ref to avoid dependency on fetchData
    fetchDataRef.current(controller.signal, isMounted)
      .then(() => {
      })
      .catch((e) => {
        // Silently ignore AbortError
        if (e?.name !== "AbortError" && isMounted.current) {
          console.error('[DataTable] Failed to fetch data:', e)
          // Reset lastFetchParamsRef on error to allow retry
          if (lastFetchParamsRef.current === fetchKey) {
            lastFetchParamsRef.current = ''
          }
        }
      })
      .finally(() => {
        isFetchingRef.current = false
      })
    
    return () => {
      isMounted.current = false
      // Don't call abort() - let requests complete naturally
      // Results will be ignored due to isMounted check
      // This prevents AbortError from being thrown
    }
  }, [state.collection, state.page, state.pageSize, state.search, filtersString])

  // Sync searchInput with state.search when collection changes
  React.useEffect(() => {
    setSearchInput(state.search)
  }, [state.collection])

  // Debounce search input and update state
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== state.search) {
        setState((prev) => ({
          ...prev,
          search: searchInput,
          page: 1, // Reset to first page when search changes
        }))
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timer)
  }, [searchInput, state.search, setState])

  // Default page size (stored in localStorage)
  const [defaultPageSize, setDefaultPageSize] = React.useState<number>(() => {
    if (typeof window !== 'undefined' && state.collection) {
      try {
        const saved = localStorage.getItem(`default-page-size-${state.collection}`)
        if (saved) {
          const parsed = Number(saved)
          if (!isNaN(parsed) && parsed > 0) {
            return parsed
          }
        }
      } catch (e) {
        console.warn('Failed to restore default page size from localStorage:', e)
      }
    }
    return state.pageSize
  })

  // pagination sync with admin state
  const [pagination, setPagination] = React.useState({
    pageIndex: Math.max(0, state.page - 1),
    pageSize: defaultPageSize,
  })
  
  // Restore default page size when collection changes
  React.useEffect(() => {
    if (!state.collection || typeof window === 'undefined') return
    
    try {
      const saved = localStorage.getItem(`default-page-size-${state.collection}`)
      if (saved) {
        const parsed = Number(saved)
        if (!isNaN(parsed) && parsed > 0) {
          setDefaultPageSize(parsed)
          setPagination(prev => ({ ...prev, pageSize: parsed }))
          setState(prev => ({ ...prev, pageSize: parsed }))
        }
      }
    } catch (e) {
      console.warn('Failed to restore default page size:', e)
    }
  }, [state.collection, setState])
  
  // Save default page size to localStorage when it changes
  React.useEffect(() => {
    if (state.collection && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`default-page-size-${state.collection}`, String(defaultPageSize))
      } catch (e) {
        console.warn('Failed to save default page size to localStorage:', e)
      }
    }
  }, [defaultPageSize, state.collection])

  React.useEffect(() => {
    // when table pagination changes, reflect to admin state
    setState((prev) => ({
      ...prev,
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
    }))
  }, [pagination.pageIndex, pagination.pageSize, setState])

  React.useEffect(() => {
    // when admin state changes externally (via URL), update table
    setPagination({ pageIndex: Math.max(0, state.page - 1), pageSize: state.pageSize })
  }, [state.page, state.pageSize])

  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(() => {
      // Restore column visibility from localStorage
      if (typeof window !== 'undefined' && state.collection) {
        try {
          const saved = localStorage.getItem(`column-visibility-${state.collection}`)
          if (saved) {
            const parsed = JSON.parse(saved)
            if (parsed && typeof parsed === 'object') {
              return parsed as VisibilityState
            }
          }
        } catch (e) {
          console.warn('Failed to restore column visibility from localStorage:', e)
        }
      }
      return {}
    })
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  
  // Date filter state
  const [dateFilter, setDateFilter] = React.useState<{
    type: 'created_at' | 'updated_at' | null
    range: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'last90days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'custom' | 'single' | null
    customStart?: Date
    customEnd?: Date
    singleDate?: Date
  }>({ type: null, range: null })
  
  // Status filter state (only for contractors collection) - now supports multiselect
  const [statusFilter, setStatusFilter] = React.useState<string[]>([])
  const [statusOptions, setStatusOptions] = React.useState<Array<{ value: string; label: string }>>([])
  
  // City filter state (only for contractors collection) - supports multiselect
  const [cityFilter, setCityFilter] = React.useState<string[]>([])
  const [cityOptions, setCityOptions] = React.useState<Array<{ value: string; label: string }>>([])
  
  const [tempSingleDate, setTempSingleDate] = React.useState<{
    created: Date | null
    updated: Date | null
  }>({ created: null, updated: null })
  
  const [tempDateRange, setTempDateRange] = React.useState<{
    created: DateRange | undefined
    updated: DateRange | undefined
  }>({
    created: undefined,
    updated: undefined
  })
  
  // Get locale for date-fns
  const dateFnsLocale = React.useMemo(() => {
    if (locale === 'ru') return ru
    if (locale === 'rs') return sr
    return enUS
  }, [locale])
  
  // Column sizing settings - separate for mobile and desktop
  const [columnSizing, setColumnSizing] = React.useState<Record<string, number>>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const isMobileDevice = window.innerWidth < 1024
      const key = isMobileDevice 
        ? `column-sizes-mobile-${state.collection}` 
        : `column-sizes-desktop-${state.collection}`
      const saved = localStorage.getItem(key)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.error('Failed to load column sizes:', e)
    }
    return {}
  })

  const [columnAlignment, setColumnAlignment] = React.useState<Record<string, 'left' | 'center' | 'right'>>(() => {
    if (typeof window !== 'undefined' && state.collection) {
      try {
        const saved = localStorage.getItem(`column-alignment-${state.collection}`)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && typeof parsed === 'object') {
            return parsed as Record<string, 'left' | 'center' | 'right'>
          }
        }
      } catch (e) {
        console.warn('Failed to restore column alignment from localStorage:', e)
      }
    }
    return {}
  })
  
  // Column order state
  const [columnOrder, setColumnOrder] = React.useState<string[]>(() => {
    if (typeof window !== 'undefined' && state.collection) {
      try {
        const saved = localStorage.getItem(`column-order-${state.collection}`)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) {
            return parsed
          }
        }
      } catch (e) {
        console.warn('Failed to restore column order from localStorage:', e)
      }
    }
    return []
  })
  
  // Column filter values (stored separately from columnFilters state)
  // Column filter values (stored separately from columnFilters state)
  // Can be string for text filters or string[] for multiselect filters
  const [columnFilterValues, setColumnFilterValues] = React.useState<Record<string, string | string[]>>(() => {
    if (typeof window !== 'undefined' && state.collection) {
      try {
        const saved = localStorage.getItem(`column-filter-values-${state.collection}`)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && typeof parsed === 'object') {
            return parsed as Record<string, string | string[]>
          }
        }
      } catch (e) {
        console.warn('Failed to restore column filter values from localStorage:', e)
      }
    }
    return {}
  })
  
  // Restore column alignment when collection changes
  React.useEffect(() => {
    if (!state.collection || typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem(`column-alignment-${state.collection}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object') {
          setColumnAlignment(parsed as Record<string, 'left' | 'center' | 'right'>)
        } else {
          setColumnAlignment({})
        }
      } else {
        setColumnAlignment({})
      }
    } catch (e) {
      console.warn('Failed to restore column alignment:', e)
      setColumnAlignment({})
    }
  }, [state.collection])
  
  // Save column alignment to localStorage when it changes
  React.useEffect(() => {
    if (state.collection && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`column-alignment-${state.collection}`, JSON.stringify(columnAlignment))
      } catch (e) {
        console.warn('Failed to save column alignment to localStorage:', e)
      }
    }
  }, [columnAlignment, state.collection])
  
  // Function to calculate date range
  const getDateRange = React.useCallback((range: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'last90days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear'): { start: Date; end: Date } => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (range) {
      case 'today':
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) }
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
        return { start: yesterday, end: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1) }
      case 'last7days':
        return { start: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000), end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) }
      case 'last30days':
        return { start: new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000), end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) }
      case 'last90days':
        return { start: new Date(today.getTime() - 89 * 24 * 60 * 60 * 1000), end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) }
      case 'thisMonth':
        return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999) }
      case 'lastMonth':
        return { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999) }
      case 'thisYear':
        return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999) }
      case 'lastYear':
        return { start: new Date(now.getFullYear() - 1, 0, 1), end: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999) }
      default:
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) }
    }
  }, [])
  
  // Apply date filter
  const applyDateFilter = React.useCallback((type: 'created_at' | 'updated_at', range: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'last90days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'custom' | 'single', customStart?: Date, customEnd?: Date, singleDate?: Date) => {
    if (range === 'custom' && (!customStart || !customEnd)) {
      return
    }
    if (range === 'single' && !singleDate) {
      return
    }
    
    let dateRange: { start: Date; end: Date }
    if (range === 'single' && singleDate) {
      // For single date, filter for the entire day
      const start = new Date(singleDate.getFullYear(), singleDate.getMonth(), singleDate.getDate())
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1)
      dateRange = { start, end }
    } else if (range === 'custom' && customStart && customEnd) {
      dateRange = { start: customStart, end: customEnd }
    } else {
      dateRange = getDateRange(range as any)
    }
    
    setDateFilter({ type, range, customStart, customEnd, singleDate })
    
    // Apply filter to columnFilters
    setColumnFilters((prev) => {
      const filtered = prev.filter(f => f.id !== 'created_at' && f.id !== 'updated_at')
      return [
        ...filtered,
        {
          id: type,
          value: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString(),
          }
        }
      ]
    })
  }, [getDateRange])
  
  // Clear date filter
  const clearDateFilter = React.useCallback(() => {
    setDateFilter({ type: null, range: null })
    setTempSingleDate({ created: null, updated: null })
    setTempDateRange({
      created: undefined,
      updated: undefined
    })
    setColumnFilters((prev) => prev.filter(f => f.id !== 'created_at' && f.id !== 'updated_at'))
  }, [])
  
  // Load status options from taxonomy (only for contractors collection)
  React.useEffect(() => {
    if (state.collection !== 'contractors') {
      setStatusOptions([])
      setStatusFilter([]) // Clear status filter when switching collections
      return
    }
    
    const loadStatusOptions = async () => {
      try {
        const queryParams = qs.stringify({
          c: 'taxonomy',
          p: 1,
          ps: 1000,
          filters: [{
            field: 'entity',
            op: 'eq',
            value: 'Contractor',
          }],
        }, {
          arrayFormat: 'brackets',
          encode: false,
        })
        
        const res = await fetch(`/api/admin/state?${queryParams}`, {
          credentials: "include",
        })
        if (!res.ok) return
        
        const json: StateResponse = await res.json()
        const opts = json.data.map((item) => {
          const value = item.name
          let label: string
          
          // Parse JSON title if it's a string
          let titleValue = item.title
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
          
          return { value, label }
        })
        
        setStatusOptions(opts)
      } catch (e) {
        console.error('Failed to load status options:', e)
      }
    }
    
    loadStatusOptions()
  }, [state.collection, locale])
  
  // Load city options from taxonomy (only for contractors collection)
  React.useEffect(() => {
    if (state.collection !== 'contractors') {
      setCityOptions([])
      setCityFilter([]) // Clear city filter when switching collections
      return
    }
    
    const loadCityOptions = async () => {
      try {
        const queryParams = qs.stringify({
          c: 'taxonomy',
          p: 1,
          ps: 1000,
          filters: [{
            field: 'entity',
            op: 'eq',
            value: 'City',
          }],
        }, {
          arrayFormat: 'brackets',
          encode: false,
        })
        
        const res = await fetch(`/api/admin/state?${queryParams}`, {
          credentials: "include",
        })
        if (!res.ok) return
        
        const json: StateResponse = await res.json()
        const opts = json.data.map((item) => {
          const value = item.name
          let label: string
          
          // Parse JSON title if it's a string
          let titleValue = item.title
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
          
          return { value, label }
        })
        
        setCityOptions(opts)
      } catch (e) {
        console.error('Failed to load city options:', e)
      }
    }
    
    loadCityOptions()
  }, [state.collection, locale])
  
  // Apply status filter (multiselect)
  // Note: We don't add to columnFilters because tanstack table uses AND logic for arrays
  // Instead, we apply the filter directly in filteredData with OR logic
  const applyStatusFilter = React.useCallback((statusValues: string[]) => {
    setStatusFilter(statusValues)
    // Remove from columnFilters to avoid double filtering with AND logic
    setColumnFilters((prev) => prev.filter(f => f.id !== 'status_name'))
  }, [])
  
  // Clear status filter
  const clearStatusFilter = React.useCallback(() => {
    setStatusFilter([])
    setColumnFilters((prev) => prev.filter(f => f.id !== 'status_name'))
  }, [])
  
  // Apply city filter (multiselect)
  // Note: We don't add to columnFilters because tanstack table uses AND logic for arrays
  // Instead, we apply the filter directly in filteredData with OR logic
  const applyCityFilter = React.useCallback((cityValues: string[]) => {
    setCityFilter(cityValues)
    // Remove from columnFilters to avoid double filtering with AND logic
    setColumnFilters((prev) => prev.filter(f => f.id !== 'city_name'))
  }, [])
  
  // Clear city filter
  const clearCityFilter = React.useCallback(() => {
    setCityFilter([])
    setColumnFilters((prev) => prev.filter(f => f.id !== 'city_name'))
  }, [])
  
  // Restore column filter values when collection changes
  React.useEffect(() => {
    if (!state.collection || typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem(`column-filter-values-${state.collection}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object') {
          setColumnFilterValues(parsed as Record<string, string | string[]>)
        } else {
          setColumnFilterValues({})
        }
      } else {
        setColumnFilterValues({})
      }
    } catch (e) {
      console.warn('Failed to restore column filter values:', e)
      setColumnFilterValues({})
    }
  }, [state.collection])
  
  // Save column filter values to localStorage when they change
  React.useEffect(() => {
    if (state.collection && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`column-filter-values-${state.collection}`, JSON.stringify(columnFilterValues))
      } catch (e) {
        console.warn('Failed to save column filter values to localStorage:', e)
      }
    }
  }, [columnFilterValues, state.collection])
  
  // Show/hide filter row under headers
  const [showFilterRow, setShowFilterRow] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined' && state.collection) {
      try {
        const saved = localStorage.getItem(`show-filter-row-${state.collection}`)
        if (saved !== null) {
          return JSON.parse(saved) === true
        }
      } catch (e) {
        console.warn('Failed to restore show filter row from localStorage:', e)
      }
    }
    return false // Default: hidden
  })
  
  // Filter visibility settings
  const [filterSettings, setFilterSettings] = React.useState<{
    dateFilter: boolean
    statusFilter: boolean
    cityFilter: boolean
    columnFilters: boolean
  }>(() => {
    if (typeof window !== 'undefined' && state.collection) {
      try {
        const saved = localStorage.getItem(`filter-settings-${state.collection}`)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && typeof parsed === 'object') {
            return {
              dateFilter: parsed.dateFilter === true,  // Явно true, иначе false
              statusFilter: parsed.statusFilter !== false,  // По умолчанию true
              cityFilter: parsed.cityFilter === true,  // Явно true, иначе false
              columnFilters: parsed.columnFilters === true,  // Явно true, иначе false
            }
          }
        }
      } catch (e) {
        console.warn('Failed to restore filter settings from localStorage:', e)
      }
    }
    return {
      dateFilter: false,  // По умолчанию отключен
      statusFilter: true,  // По умолчанию включен только статус
      cityFilter: false,   // По умолчанию отключен
      columnFilters: false, // По умолчанию отключен
    }
  })
  
  // Save filter settings to localStorage
  React.useEffect(() => {
    if (state.collection && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`filter-settings-${state.collection}`, JSON.stringify(filterSettings))
      } catch (e) {
        console.warn('Failed to save filter settings to localStorage:', e)
      }
    }
  }, [filterSettings, state.collection])
  
  // Restore filter settings when collection changes
  React.useEffect(() => {
    if (!state.collection || typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem(`filter-settings-${state.collection}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object') {
          setFilterSettings({
            dateFilter: parsed.dateFilter === true,  // Явно true, иначе false
            statusFilter: parsed.statusFilter !== false,  // По умолчанию true
            cityFilter: parsed.cityFilter === true,  // Явно true, иначе false
            columnFilters: parsed.columnFilters === true,  // Явно true, иначе false
          })
        }
      } else {
        setFilterSettings({
          dateFilter: false,  // По умолчанию отключен
          statusFilter: true,  // По умолчанию включен только статус
          cityFilter: false,   // По умолчанию отключен
          columnFilters: false, // По умолчанию отключен
        })
      }
    } catch (e) {
      console.warn('Failed to restore filter settings:', e)
      setFilterSettings({
        dateFilter: false,  // По умолчанию отключен
        statusFilter: true,  // По умолчанию включен только статус
        cityFilter: false,   // По умолчанию отключен
        columnFilters: false, // По умолчанию отключен
      })
    }
  }, [state.collection])

  const [cardViewModeMobile, setCardViewModeMobile] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined' && state.collection) {
      try {
        const saved = localStorage.getItem(`card-view-mode-mobile-${state.collection}`)
        if (saved !== null) {
          return JSON.parse(saved) === true
        }
      } catch (e) {
        console.warn('Failed to restore card view mode mobile from localStorage:', e)
      }
    }
    return false // Default: table view
  })

  // Edit mode state
  const [editMode, setEditMode] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined' && state.collection) {
      try {
        const saved = localStorage.getItem(`edit-mode-${state.collection}`)
        if (saved !== null) {
          return JSON.parse(saved)
        }
      } catch (e) {
        // Ignore
      }
    }
    return false
  })
  
  // Store edited cells locally (rowId -> fieldName -> value)
  const [editedCells, setEditedCells] = React.useState<Map<string, Record<string, any>>>(() => new Map())
  
  // Track if there are unsaved changes
  const hasUnsavedChanges = editedCells.size > 0
  
  const [cardViewModeDesktop, setCardViewModeDesktop] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined' && state.collection) {
      try {
        const saved = localStorage.getItem(`card-view-mode-desktop-${state.collection}`)
        if (saved !== null) {
          return JSON.parse(saved) === true
        }
      } catch (e) {
        console.warn('Failed to restore card view mode desktop from localStorage:', e)
      }
    }
    return false // Default: table view
  })

  const [cardsPerRow, setCardsPerRow] = React.useState<number>(() => {
    if (typeof window !== 'undefined' && state.collection) {
      try {
        const saved = localStorage.getItem(`cards-per-row-${state.collection}`)
        if (saved !== null) {
          const value = parseInt(saved, 10)
          if (value >= 1 && value <= 6) {
            return value
          }
        }
      } catch (e) {
        console.warn('Failed to restore cards per row from localStorage:', e)
      }
    }
    return 3 // Default: 3 cards per row on desktop
  })
  
  // Restore show filter row when collection changes
  React.useEffect(() => {
    if (!state.collection || typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem(`show-filter-row-${state.collection}`)
      if (saved !== null) {
        setShowFilterRow(JSON.parse(saved) === true)
      } else {
        setShowFilterRow(false)
      }
    } catch (e) {
      console.warn('Failed to restore show filter row:', e)
      setShowFilterRow(false)
    }
  }, [state.collection])
  
  // Save show filter row to localStorage when it changes
  React.useEffect(() => {
    if (state.collection && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`show-filter-row-${state.collection}`, JSON.stringify(showFilterRow))
      } catch (e) {
        console.warn('Failed to save show filter row to localStorage:', e)
      }
    }
  }, [showFilterRow, state.collection])

  // Restore card view mode mobile when collection changes
  React.useEffect(() => {
    if (!state.collection || typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem(`card-view-mode-mobile-${state.collection}`)
      if (saved !== null) {
        setCardViewModeMobile(JSON.parse(saved) === true)
      } else {
        setCardViewModeMobile(false)
      }
    } catch (e) {
      console.warn('Failed to restore card view mode mobile:', e)
      setCardViewModeMobile(false)
    }
  }, [state.collection])

  // Save card view mode mobile to localStorage when it changes
  React.useEffect(() => {
    if (state.collection && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`card-view-mode-mobile-${state.collection}`, JSON.stringify(cardViewModeMobile))
      } catch (e) {
        console.warn('Failed to save card view mode mobile to localStorage:', e)
      }
    }
  }, [cardViewModeMobile, state.collection])

  // Restore card view mode desktop when collection changes
  React.useEffect(() => {
    if (!state.collection || typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem(`card-view-mode-desktop-${state.collection}`)
      if (saved !== null) {
        setCardViewModeDesktop(JSON.parse(saved) === true)
      } else {
        setCardViewModeDesktop(false)
      }
    } catch (e) {
      console.warn('Failed to restore card view mode desktop:', e)
      setCardViewModeDesktop(false)
    }
  }, [state.collection])

  // Save card view mode desktop to localStorage when it changes
  React.useEffect(() => {
    if (state.collection && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`card-view-mode-desktop-${state.collection}`, JSON.stringify(cardViewModeDesktop))
      } catch (e) {
        console.warn('Failed to save card view mode desktop to localStorage:', e)
      }
    }
  }, [cardViewModeDesktop, state.collection])

  // Restore cards per row when collection changes
  React.useEffect(() => {
    if (!state.collection || typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem(`cards-per-row-${state.collection}`)
      if (saved !== null) {
        const value = parseInt(saved, 10)
        if (value >= 1 && value <= 6) {
          setCardsPerRow(value)
        } else {
          setCardsPerRow(3)
        }
      } else {
        setCardsPerRow(3)
      }
    } catch (e) {
      console.warn('Failed to restore cards per row:', e)
      setCardsPerRow(3)
    }
  }, [state.collection])

  // Save cards per row to localStorage when it changes
  React.useEffect(() => {
    if (state.collection && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`cards-per-row-${state.collection}`, String(cardsPerRow))
      } catch (e) {
        console.warn('Failed to save cards per row to localStorage:', e)
      }
    }
  }, [cardsPerRow, state.collection])

  // Restore cards per row when collection changes
  React.useEffect(() => {
    if (!state.collection || typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem(`cards-per-row-${state.collection}`)
      if (saved !== null) {
        const value = parseInt(saved, 10)
        if (value >= 1 && value <= 6) {
          setCardsPerRow(value)
        } else {
          setCardsPerRow(3)
        }
      } else {
        setCardsPerRow(3)
      }
    } catch (e) {
      console.warn('Failed to restore cards per row:', e)
      setCardsPerRow(3)
    }
  }, [state.collection])

  // Save cards per row to localStorage when it changes
  React.useEffect(() => {
    if (state.collection && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`cards-per-row-${state.collection}`, String(cardsPerRow))
      } catch (e) {
        console.warn('Failed to save cards per row to localStorage:', e)
      }
    }
  }, [cardsPerRow, state.collection])
  
  // Restore column visibility when collection changes
  // Priority: global role settings > localStorage > default (all visible)
  React.useEffect(() => {
    if (!state.collection || typeof window === 'undefined') return
    
    const loadColumnVisibility = async () => {
      try {
        // First, try to load global settings for role
        if (primaryRole) {
          const globalVisibility = await getTableColumnVisibility(state.collection, primaryRole)
          if (globalVisibility && Object.keys(globalVisibility).length > 0) {
            // Ensure created_at and updated_at are hidden by default if not explicitly set
            const visibility = { ...globalVisibility }
            if (visibility.created_at === undefined) {
              visibility.created_at = false
            }
            if (visibility.updated_at === undefined) {
              visibility.updated_at = false
            }
            setColumnVisibility(visibility)
            return
          }
        }
        
        // Fallback to localStorage
        const saved = localStorage.getItem(`column-visibility-${state.collection}`)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && typeof parsed === 'object') {
            // Ensure created_at and updated_at are hidden by default if not explicitly set
            const visibility = parsed as VisibilityState
            if (visibility.created_at === undefined) {
              visibility.created_at = false
            }
            if (visibility.updated_at === undefined) {
              visibility.updated_at = false
            }
            setColumnVisibility(visibility)
            return
          }
        }
        
        // Default: all visible, except created_at and updated_at (hidden by default)
        setColumnVisibility({
          created_at: false,
          updated_at: false,
        })
      } catch (e) {
        console.warn('Failed to restore column visibility:', e)
        setColumnVisibility({})
      }
    }
    
    loadColumnVisibility()
  }, [state.collection, primaryRole])
  
  // Reload data when search conditions with operators change (need all data for client-side filtering)
  React.useEffect(() => {
    const hasOperators = searchConditions.some(c => c.operator)
    if (hasOperators && searchConditions.length > 0) {
      const controller = new AbortController()
      const isMounted = { current: true }
      // Use ref to avoid dependency on fetchData
      void fetchDataRef.current(controller.signal, isMounted)
    }
  }, [searchConditions])
  
  // Get collection config early to access defaultSort
  const collectionConfig = React.useMemo(() => {
    return state.collection ? getCollection(state.collection) : null
  }, [state.collection])

  // Default sorting state (stored in localStorage)
  const defaultSorting = React.useMemo<SortingState>(() => {
    const collection = getCollection(state.collection)
    return [...collection.__defaultSort] as SortingState
  }, [state.collection])
  
  const defaultSortingKey = React.useMemo<string>(()=>{
    return `default-sorting-${state.collection}`
  }, [state.collection])

  const [sorting, setSorting] = useLocalStorage(defaultSortingKey, defaultSorting)

  
  
  // Save column visibility to localStorage when it changes
  React.useEffect(() => {
    if (state.collection && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`column-visibility-${state.collection}`, JSON.stringify(columnVisibility))
      } catch (e) {
        console.warn('Failed to save column visibility to localStorage:', e)
      }
    }
  }, [columnVisibility, state.collection])

  // Delete confirmation state
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [recordToDelete, setRecordToDelete] = React.useState<CollectionData | null>(null)
  const onDeleteRequest = React.useCallback((row: Row<CollectionData>) => {
    setRecordToDelete(row.original)
    setConfirmOpen(true)
  }, [])

  // Batch delete confirmation state
  const [batchDeleteOpen, setBatchDeleteOpen] = React.useState(false)
  const [batchDeleting, setBatchDeleting] = React.useState(false)
  
  // Export dialog state
  const [exportOpen, setExportOpen] = React.useState(false)
  const [exportFormat, setExportFormat] = React.useState<ExportFormat>('csv')
  const [exportData, setExportData] = React.useState<string>('')
  const [exportCopied, setExportCopied] = React.useState(false)
  
  // Import state
  const [importOpen, setImportOpen] = React.useState(false)
  const [importFormat, setImportFormat] = React.useState<ImportFormat>('csv')
  const [importFile, setImportFile] = React.useState<File | null>(null)
  const [importText, setImportText] = React.useState<string>('')
  const [importMode, setImportMode] = React.useState<'file' | 'paste'>('file')
  const [importProgress, setImportProgress] = React.useState({ imported: 0, total: 0 })
  const [importResult, setImportResult] = React.useState<{ success: boolean; imported: number; errors: string[] } | null>(null)
  const [importing, setImporting] = React.useState(false)

  // Create dialog state
  const [createOpen, setCreateOpen] = React.useState(false)
  const [formData, setFormData] = React.useState<Record<string, any>>({})
  const [createError, setCreateError] = React.useState<string | null>(null)
  // Language selector for i18n JSON fields (e.g., title)
  const [jsonFieldLanguage, setJsonFieldLanguage] = React.useState<Record<string, LanguageCode>>({})

  // Clear form data when collection changes
  React.useEffect(() => {
    setFormData({})
    setCreateError(null)
    setJsonFieldLanguage({}) // Reset language selectors
    setPriceInputs({})
  }, [state.collection])

  // Fields to skip (auto-generated): id, uuid, {x}aid (but not relation fields), created_at, updated_at, deleted_at
  const isAutoGeneratedField = React.useCallback((fieldName: string, hasRelation?: boolean): boolean => {
    const lower = fieldName.toLowerCase()
    return (
      lower === 'id' ||
      lower === 'uuid' ||
      // Skip aid fields unless they have relations (raid must be editable)
      (lower.endsWith('aid') && !hasRelation && lower !== 'raid') ||
      lower === 'created_at' ||
      lower === 'updated_at' ||
      lower === 'deleted_at' ||
      false
    )
  }, [])

  const editableFields = React.useMemo(
    () => schema.filter((col) => {
      // For relation fields, allow them even if primary (they might be marked as primary in DB schema)
      const isRelationField = !!col.relation
      const shouldInclude = !isAutoGeneratedField(col.name, isRelationField) && (!col.primary || isRelationField) && !col.hidden
      
      // Debug log for contractors relation fields
      if (state.collection === 'contractors' && (col.name === 'status_name' || col.name === 'city_name')) {
        console.log(`[DataTable editableFields] Field ${col.name}:`, {
          hasRelation: !!col.relation,
          relation: col.relation,
          isPrimary: col.primary,
          isHidden: col.hidden,
          isAutoGenerated: isAutoGeneratedField(col.name, isRelationField),
          shouldInclude,
        })
      }
      
      return shouldInclude
    }),
    [schema, isAutoGeneratedField, state.collection]
  )

  // Edit dialog state
  const [editOpen, setEditOpen] = React.useState(false)
  const [recordToEdit, setRecordToEdit] = React.useState<CollectionData | null>(null)
  const [editData, setEditData] = React.useState<Record<string, any>>({})
  const [editError, setEditError] = React.useState<string | null>(null)
  const [isDuplicate, setIsDuplicate] = React.useState(false)

  // Clear edit data when collection changes
  React.useEffect(() => {
    setEditData({})
    setEditError(null)
    setRecordToEdit(null)
    setIsDuplicate(false)
    setJsonFieldLanguage({}) // Reset language selectors
    setPriceInputs({})
  }, [state.collection])

  // Init create data_in when drawer opens
  React.useEffect(() => {
    if (!createOpen) {
      // Clear temp inputs when drawer closes
      setCreateKeyInputs({})
      setCreateTitleInputs({})
      setCreateValueInputs({})
      return
    }
    
    const initializeDataInFields = async () => {
    const existing = (formData as any).data_in
      
      // If no existing data_in, load global fields for collection
      if (!existing || (typeof existing === 'object' && Object.keys(existing).length === 0)) {
        try {
          const globalFields = await getTableDataInFields(state.collection)
          if (globalFields.length > 0) {
            // Convert global fields to language object format (same as entriesToLanguageObject produces)
            const langObj: Record<string, Record<string, { title: string; value: string }>> = {}
            for (const field of globalFields) {
              langObj[field.key] = {}
              for (const lang of supportedLanguageCodes) {
                const title = field.title[lang] || field.title.en || field.title.ru || field.title.rs || field.key
                langObj[field.key][lang] = {
                  title,
                  value: field.defaultValue || '',
                }
              }
            }
            
            // Convert to entries format (expands language objects)
            const entries = objectToEntries(langObj)
            setCreateDataInEntries(entries)
            
            try {
              setCreateDataInRaw(JSON.stringify(langObj, null, 2))
            } catch {
              setCreateDataInRaw("{}")
            }
          } else {
            // No global fields, use empty
    const entries = objectToEntries(existing)
    setCreateDataInEntries(entries)
    try {
      setCreateDataInRaw(JSON.stringify(existing && typeof existing === "object" ? existing : {}, null, 2))
    } catch {
      setCreateDataInRaw("{}")
    }
          }
        } catch (error) {
          console.error('Failed to load global data_in fields:', error)
          // Fallback to existing or empty
          const entries = objectToEntries(existing)
          setCreateDataInEntries(entries)
          try {
            setCreateDataInRaw(JSON.stringify(existing && typeof existing === "object" ? existing : {}, null, 2))
          } catch {
            setCreateDataInRaw("{}")
          }
        }
      } else {
        // Use existing data_in
        const entries = objectToEntries(existing)
        setCreateDataInEntries(entries)
        try {
          setCreateDataInRaw(JSON.stringify(existing && typeof existing === "object" ? existing : {}, null, 2))
        } catch {
          setCreateDataInRaw("{}")
        }
      }
      
      // Clear temp inputs when drawer opens
      setCreateKeyInputs({})
      setCreateTitleInputs({})
      setCreateValueInputs({})
    setCreateDataInRawError(null)
    setCreateFormTab("main")
      setCreateDataInLanguage(locale)
    }
    
    initializeDataInFields()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createOpen, locale, state.collection])

  // Auto-populate XAID from selected expanse when create form opens or expanse changes
  React.useEffect(() => {
    if (!createOpen || !state.collection) return

    // Check if collection has xaid field in schema
    const hasXaidField = schema.some((col) => col.name === 'xaid')
    if (!hasXaidField) return

    // Check if xaid field is hidden or read-only
    const xaidField = schema.find((col) => col.name === 'xaid')
    if (xaidField?.hidden || xaidField?.readOnly) return

    // Skip for expanses collection (xaid is auto-generated there)
    if (state.collection === 'expanses') return

    // Get selected expanse xaid from localStorage
    if (typeof window !== 'undefined') {
      const selectedXaid = localStorage.getItem('selected-expanse-xaid')
      
      // Only set if value exists and is not empty
      if (selectedXaid && selectedXaid.trim() !== '') {
        // Only set if not already set in formData
        if (!formData.xaid || formData.xaid === '') {
          setFormData((prev) => ({ ...prev, xaid: selectedXaid }))
        }
      } else {
        // If "Общее" is selected (empty value), ensure xaid is empty
        if (formData.xaid) {
          setFormData((prev) => {
            const updated = { ...prev }
            delete updated.xaid
            return updated
          })
        }
      }
    }
  }, [createOpen, state.collection, schema, formData.xaid])

  // Listen for expanse selection changes
  React.useEffect(() => {
    if (!createOpen || !state.collection) return

    const hasXaidField = schema.some((col) => col.name === 'xaid')
    if (!hasXaidField || state.collection === 'expanses') return

    const xaidField = schema.find((col) => col.name === 'xaid')
    // For readOnly fields, still allow auto-population from expanse selector
    // Only skip if field is explicitly hidden
    if (xaidField?.hidden) return

    const handleExpanseSelected = (e: CustomEvent) => {
      const selectedXaid = e.detail as string
      if (selectedXaid && selectedXaid.trim() !== '') {
        setFormData((prev) => ({ ...prev, xaid: selectedXaid }))
      } else {
        setFormData((prev) => {
          const updated = { ...prev }
          delete updated.xaid
          return updated
        })
      }
    }

    window.addEventListener('expanse-selected', handleExpanseSelected as EventListener)
    return () => {
      window.removeEventListener('expanse-selected', handleExpanseSelected as EventListener)
    }
  }, [createOpen, state.collection, schema])

  // Sync createDataInRaw when createDataInEntries changes
  React.useEffect(() => {
    if (!createOpen) return
    const obj = entriesToLanguageObject(createDataInEntries)
    try {
      setCreateDataInRaw(JSON.stringify(obj, null, 2))
      setCreateDataInRawError(null)
    } catch (e) {
      setCreateDataInRawError(e instanceof Error ? e.message : "Failed to stringify")
    }
  }, [createDataInEntries, createOpen, entriesToLanguageObject])

  // Init edit data_in when drawer opens
  React.useEffect(() => {
    if (!editOpen || !recordToEdit) {
      // Clear temp inputs when drawer closes
      setEditKeyInputs({})
      setEditTitleInputs({})
      setEditValueInputs({})
      return
    }
    const existing = (editData as any).data_in
    const entries = objectToEntries(existing)
    setEditDataInEntries(entries)
    // Clear temp inputs when drawer opens
    setEditKeyInputs({})
    setEditTitleInputs({})
    setEditValueInputs({})
    try {
      setEditDataInRaw(JSON.stringify(existing && typeof existing === "object" ? existing : {}, null, 2))
    } catch {
      setEditDataInRaw("{}")
    }
    setEditDataInRawError(null)
    setEditFormTab("main")
    setEditDataInLanguage(locale)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editOpen, recordToEdit, locale])

  // Sync editDataInRaw when editDataInEntries changes
  React.useEffect(() => {
    if (!editOpen) return
    const obj = entriesToLanguageObject(editDataInEntries)
    try {
      setEditDataInRaw(JSON.stringify(obj, null, 2))
    } catch {
      // ignore
    }
  }, [editDataInEntries, editOpen, entriesToLanguageObject])

      const enabledLanguageCodes = supportedLanguageCodes

  const getI18nJsonFieldsForCollection = React.useCallback((collection: string): string[] => {
  if (collection === 'taxonomy') return ['title', 'category']
  if (collection === 'roles') return ['title']
  if (collection === 'expanses') return ['title']
  if (collection === 'contractors') return ['title']
    return []
  }, [])

  const onEditRequest = React.useCallback((row: Row<CollectionData>) => {
    try {
      const record = row.original
      setRecordToEdit(record)
      const initial: Record<string, any> = {}
      const pricePrefill: Record<string, string> = {}
      const i18nFields = getI18nJsonFieldsForCollection(state.collection)
      // Add system fields for info tab
      if (state.collection === 'roles') {
        initial.id = record.id ?? null
        initial.uuid = record.uuid ?? null
        initial.order = record.order ?? null
        initial.created_at = record.created_at ?? null
        initial.updated_at = record.updated_at ?? null
      }
      if (state.collection === 'contractors') {
        initial.id = record.id ?? null
        initial.uuid = record.uuid ?? null
        initial.xaid = record.xaid ?? null
        initial.order = record.order ?? null
        initial.created_at = record.created_at ?? null
        initial.updated_at = record.updated_at ?? null
      }
      
      for (const col of schema) {
        if (!isAutoGeneratedField(col.name, !!col.relation) && !col.primary) {
          if (col.fieldType === 'boolean') {
            initial[col.name] =
              record[col.name] === 1 ||
              record[col.name] === true ||
              record[col.name] === '1' ||
              record[col.name] === 'true'
          } else if (col.fieldType === 'date' || col.fieldType === 'time' || col.fieldType === 'datetime') {
            initial[col.name] = record[col.name] ? new Date(record[col.name]) : null
          } else if (col.fieldType === 'json' && i18nFields.includes(col.name)) {
            // For i18n JSON fields, parse and extract values per enabled language
            let jsonValue = record[col.name]

            // If category is empty, try to extract it from data_in
            if (col.name === 'category' && (!jsonValue || jsonValue === '' || jsonValue === null)) {
              const dataIn = record.data_in
              if (dataIn && typeof dataIn === 'string') {
                try {
                  const dataInJson = JSON.parse(dataIn)
                  if (dataInJson && typeof dataInJson === 'object' && dataInJson.category) {
                    jsonValue = dataInJson.category
                  }
                } catch {
                  // ignore
                }
              }
            }

            if (typeof jsonValue === 'string') {
              try {
                jsonValue = JSON.parse(jsonValue)
              } catch {
                // If it's not valid JSON, treat as plain text (backward compatibility)
                const replicated: Record<string, string> = {}
                enabledLanguageCodes.forEach((lc) => {
                  replicated[lc] = jsonValue || ''
                })
                jsonValue = replicated
              }
            }
            if (!jsonValue || typeof jsonValue !== 'object') {
              jsonValue = {}
            }
            enabledLanguageCodes.forEach((lc) => {
              initial[`${col.name}_${lc}`] = (jsonValue as any)[lc] || ''
            })
            setJsonFieldLanguage((prev) => ({ ...prev, [col.name]: locale }))
          } else if (col.fieldType === 'price') {
            const cents = record[col.name]
            const numericCents = cents == null ? null : Number(cents)
            initial[col.name] = numericCents
            pricePrefill[`edit-${col.name}`] =
              numericCents == null || Number.isNaN(numericCents) ? '' : (numericCents / 100).toFixed(2)
          } else if (col.fieldType === 'json') {
            // Keep JSON fields as objects (or parse from string if needed)
            if (record[col.name] != null) {
              if (typeof record[col.name] === 'string') {
                try {
                  initial[col.name] = JSON.parse(record[col.name])
                } catch {
                  initial[col.name] = {}
                }
              } else {
                initial[col.name] = record[col.name]
              }
            } else {
              initial[col.name] = {}
            }
          } else {
            initial[col.name] = record[col.name] != null ? String(record[col.name]) : ''
          }
        }
      }
      setEditData(initial)
      if (Object.keys(pricePrefill).length > 0) {
        setPriceInputs((prev) => ({ ...prev, ...pricePrefill }))
      }
      setEditError(null)
      setEditOpen(true)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      setEditError(message)
      setEditOpen(true)
    }
  }, [schema, isAutoGeneratedField, state.collection, locale, enabledLanguageCodes, getI18nJsonFieldsForCollection])

  const onDuplicateRequest = React.useCallback((row: Row<CollectionData>) => {
    try {
      const record = row.original
      // Create a copy of the record without id, uuid, and other system fields
      const duplicatedRecord = { ...record }
      delete duplicatedRecord.id
      delete duplicatedRecord.uuid
      delete duplicatedRecord.created_at
      delete duplicatedRecord.updated_at
      delete duplicatedRecord.deleted_at
      
      setRecordToEdit(duplicatedRecord)
      const initial: Record<string, any> = {}
      const pricePrefill: Record<string, string> = {}
      const i18nFields = getI18nJsonFieldsForCollection(state.collection)
      
      for (const col of schema) {
        if (!isAutoGeneratedField(col.name, !!col.relation) && !col.primary) {
          if (col.fieldType === 'boolean') {
            initial[col.name] =
              duplicatedRecord[col.name] === 1 ||
              duplicatedRecord[col.name] === true ||
              duplicatedRecord[col.name] === '1' ||
              duplicatedRecord[col.name] === 'true'
          } else if (col.fieldType === 'date' || col.fieldType === 'time' || col.fieldType === 'datetime') {
            initial[col.name] = duplicatedRecord[col.name] ? new Date(duplicatedRecord[col.name]) : null
          } else if (col.fieldType === 'json' && i18nFields.includes(col.name)) {
            // For i18n JSON fields, parse and extract values per enabled language
            let jsonValue = duplicatedRecord[col.name]

            // If category is empty, try to extract it from data_in
            if (col.name === 'category' && (!jsonValue || jsonValue === '' || jsonValue === null)) {
              const dataIn = duplicatedRecord.data_in
              if (dataIn && typeof dataIn === 'string') {
                try {
                  const dataInJson = JSON.parse(dataIn)
                  if (dataInJson && typeof dataInJson === 'object' && dataInJson.category) {
                    jsonValue = dataInJson.category
                  }
                } catch {
                  // ignore
                }
              }
            }

            if (typeof jsonValue === 'string') {
              try {
                jsonValue = JSON.parse(jsonValue)
              } catch {
                // If it's not valid JSON, treat as plain text (backward compatibility)
                const replicated: Record<string, string> = {}
                enabledLanguageCodes.forEach((lc) => {
                  replicated[lc] = jsonValue || ''
                })
                jsonValue = replicated
              }
            }
            if (!jsonValue || typeof jsonValue !== 'object') {
              jsonValue = {}
            }
            enabledLanguageCodes.forEach((lc) => {
              initial[`${col.name}_${lc}`] = (jsonValue as any)[lc] || ''
            })
            setJsonFieldLanguage((prev) => ({ ...prev, [col.name]: locale }))
          } else if (col.fieldType === 'price') {
            const cents = duplicatedRecord[col.name]
            const numericCents = cents == null ? null : Number(cents)
            initial[col.name] = numericCents
            pricePrefill[`edit-${col.name}`] =
              numericCents == null || Number.isNaN(numericCents) ? '' : (numericCents / 100).toFixed(2)
          } else if (col.fieldType === 'json') {
            // Keep JSON fields as objects (or parse from string if needed)
            if (duplicatedRecord[col.name] != null) {
              if (typeof duplicatedRecord[col.name] === 'string') {
                try {
                  initial[col.name] = JSON.parse(duplicatedRecord[col.name])
                } catch {
                  initial[col.name] = {}
                }
              } else {
                initial[col.name] = duplicatedRecord[col.name]
              }
            } else {
              initial[col.name] = {}
            }
          } else if (col.relation) {
            // For relation fields, extract only the ID value, not the entire object
            const relationValue = duplicatedRecord[col.name]
            if (relationValue != null) {
              if (typeof relationValue === 'object' && !Array.isArray(relationValue)) {
                // If it's an object, extract the ID field
                const idValue = (relationValue as any)[col.relation.valueField] || (relationValue as any).id || (relationValue as any)[primaryKey]
                initial[col.name] = idValue != null ? String(idValue) : ''
              } else {
                // If it's already a primitive (ID), use it as-is
                initial[col.name] = String(relationValue)
              }
            } else {
              initial[col.name] = ''
            }
          } else {
            initial[col.name] = duplicatedRecord[col.name] != null ? String(duplicatedRecord[col.name]) : ''
          }
        }
      }
      setEditData(initial)
      if (Object.keys(pricePrefill).length > 0) {
        setPriceInputs((prev) => ({ ...prev, ...pricePrefill }))
      }
      setEditError(null)
      setIsDuplicate(true)
      setEditOpen(true)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      setEditError(message)
      setIsDuplicate(false)
      setEditOpen(true)
    }
  }, [schema, isAutoGeneratedField, state.collection, locale, enabledLanguageCodes, getI18nJsonFieldsForCollection])

  const handleEditFieldChange = React.useCallback((fieldName: string, value: string | boolean | Date | number | null) => {
    // Log relation field changes to debug project creation issue
    const field = schema.find((f) => f.name === fieldName)
    if (field?.relation) {
      console.log(`[handleEditFieldChange] Relation field ${fieldName}:`, { value, type: typeof value, isObject: typeof value === 'object' && value !== null })
    }
    setEditData((prev) => ({ ...prev, [fieldName]: value }))
  }, [schema])

  // Create dialog keep after
  // Generate columns dynamically
  // Function to handle inline cell updates (stores changes locally, doesn't save)
  const handleCellUpdate = React.useCallback((rowId: string | number, fieldName: string, value: any) => {
    const rowIdStr = String(rowId)
    setEditedCells(prev => {
      const newMap = new Map(prev)
      const rowChanges = newMap.get(rowIdStr) || {}
      
      // Prepare value based on field type
      const field = schema.find(f => f.name === fieldName)
      let processedValue = value
      
      if (field) {
        if (field.fieldType === 'price' && typeof value === 'number') {
          processedValue = value
        } else if (field.fieldType === 'boolean') {
          processedValue = value === true || value === 'true' || value === 1 || value === '1'
        } else if (value instanceof Date && typeof value.toISOString === 'function') {
          processedValue = value.toISOString()
        } else if (field.fieldType === 'json' && value != null && typeof value === 'object') {
          processedValue = value
        } else {
          processedValue = value
        }
      }
      
      rowChanges[fieldName] = processedValue
      newMap.set(rowIdStr, rowChanges)
      return newMap
    })
  }, [schema])
  
  // Function to save all changes at once
  const handleSaveAllChanges = React.useCallback(async () => {
    if (editedCells.size === 0) return
    
    try {
      const primaryKey = schema.find(f => f.primary)?.name || 'id'
      
      // Save all changes in parallel
      const promises = Array.from(editedCells.entries()).map(async ([rowIdStr, changes]) => {
        const rowId = rowIdStr
        const payload: Record<string, any> = {}
        
        // Process each field change
        for (const [fieldName, value] of Object.entries(changes)) {
          if (fieldName === 'data_in') {
            payload.data_in = value
          } else {
            const field = schema.find(f => f.name === fieldName)
            if (field) {
              if (field.fieldType === 'price' && typeof value === 'number') {
                payload[fieldName] = value
              } else if (field.fieldType === 'boolean') {
                payload[fieldName] = value === true || value === 'true' || value === 1 || value === '1'
              } else if (value instanceof Date && typeof value.toISOString === 'function') {
                payload[fieldName] = value.toISOString()
              } else if (field.fieldType === 'json' && value != null && typeof value === 'object') {
                payload[fieldName] = value
              } else {
                payload[fieldName] = value
              }
            } else {
              payload[fieldName] = value
            }
          }
        }
        
        const res = await fetch(`/api/admin/${encodeURIComponent(state.collection)}/${encodeURIComponent(String(rowId))}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        })
        
        if (!res.ok) {
          const json = await res.json() as { error?: string }
          throw new Error(json.error || `Update failed for row ${rowId}: ${res.status}`)
        }
      })
      
      await Promise.all(promises)
      
      // Clear edited cells and refresh data
      setEditedCells(new Map())
      await fetchData()
    } catch (e) {
      console.error('Failed to save changes:', e)
      throw e
    }
  }, [editedCells, schema, state.collection, fetchData])
  
  const columns = React.useMemo(
    () => (schema.length > 0 ? generateColumns(schema, onDeleteRequest, onEditRequest, onDuplicateRequest, locale, relationData, t, state.collection, data, columnVisibility, columnAlignment, columnSizing, editMode, handleCellUpdate, schema, undefined, segmentStatuses) : []),
    [schema, onDeleteRequest, onEditRequest, onDuplicateRequest, locale, relationData, t, state.collection, data, columnVisibility, columnAlignment, columnSizing, editMode, handleCellUpdate, segmentStatuses]
  )

  // Parse search query for client-side filtering with operators
  const parsedSearchQuery = React.useMemo(() => {
    if (searchConditions.length > 0) {
      return { conditions: searchConditions, defaultOperator: 'OR' as const }
    }
    return null
  }, [searchConditions])

  // Check if we need client-side filtering (when search has operators)
  const needsClientSideFilter = React.useMemo(() => {
    return parsedSearchQuery && parsedSearchQuery.conditions.some(c => c.operator)
  }, [parsedSearchQuery])

  // Filter data client-side if search has operators (server doesn't support them)
  const filteredData = React.useMemo(() => {
    let result = data
    
    // Apply date filters
    if (dateFilter.type && dateFilter.range) {
      const filterType = dateFilter.type
      const dateRange = dateFilter.range === 'custom' && dateFilter.customStart && dateFilter.customEnd
        ? { start: dateFilter.customStart, end: dateFilter.customEnd }
        : getDateRange(dateFilter.range as any)
      
      result = result.filter((row) => {
        const cellValue = row[filterType] as string | null | undefined
        if (!cellValue) return false
        const cellDate = new Date(cellValue)
        return cellDate >= dateRange.start && cellDate <= dateRange.end
      })
    }
    
    // Apply status filter (multiselect)
    if (statusFilter.length > 0) {
      result = result.filter((row) => {
        const cellValue = row.status_name as string | null | undefined
        return cellValue && statusFilter.includes(cellValue)
      })
    }
    
    // Apply city filter (multiselect)
    if (cityFilter.length > 0) {
      result = result.filter((row) => {
        const cellValue = row.city_name as string | null | undefined
        return cellValue && cityFilter.includes(cellValue)
      })
    }
    
    if (!needsClientSideFilter || !parsedSearchQuery) {
      return result
    }

    // Has operators - filter client-side
    const filtered = result.filter((row) => {
      // Search across all text fields in the row
      const searchableText = Object.values(row)
        .filter(v => v != null)
        .map(v => {
          if (typeof v === 'string') return v
          if (typeof v === 'number') return String(v)
          if (typeof v === 'boolean') return String(v)
          if (typeof v === 'object') {
            try {
              return JSON.stringify(v)
            } catch {
              return ''
            }
          }
          return ''
        })
        .join(' ')

      const matches = matchesSearchQuery(searchableText.toLowerCase(), parsedSearchQuery, false)
      return matches
    })

    // Update total when filtering client-side
    if (filtered.length !== total) {
      setTotal(filtered.length)
      setTotalPages(Math.max(1, Math.ceil(filtered.length / pagination.pageSize)))
    }

    return filtered
  }, [data, parsedSearchQuery, needsClientSideFilter, total, pagination.pageSize, dateFilter, statusFilter, cityFilter, getDateRange])
  
  // Update total when status or city filters are applied (client-side filtering)
  React.useEffect(() => {
    if (statusFilter.length > 0 || cityFilter.length > 0 || (dateFilter.type && dateFilter.range)) {
      const filteredLength = filteredData.length
      if (filteredLength !== total) {
        setTotal(filteredLength)
        setTotalPages(Math.max(1, Math.ceil(filteredLength / pagination.pageSize)))
      }
    }
  }, [statusFilter, cityFilter, dateFilter, filteredData.length, total, pagination.pageSize])

  // Reorder columns for mobile: move actions to the beginning
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 1024
  })

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const reorderedColumns = React.useMemo(() => {
    // Always start with all columns
    const allColumnsMap = new Map(columns.map(col => [col.id, col]))
    
    // Apply saved column order if available
    if (columnOrder.length > 0) {
      const orderedColumns: ColumnDef<CollectionData>[] = []
      const unorderedColumns: ColumnDef<CollectionData>[] = []
      const processedIds = new Set<string>()
      
      // Add columns in saved order (only if they exist in current columns)
      for (const columnId of columnOrder) {
        const col = allColumnsMap.get(columnId)
        if (col && col.id) {
          // Skip select and actions columns - they have fixed positions
          if (col.id !== 'select' && col.id !== 'actions') {
            orderedColumns.push(col)
            processedIds.add(col.id)
          }
        }
      }
      
      // Add remaining columns that weren't in the saved order
      allColumnsMap.forEach((col) => {
        const colId = col.id
        if (colId && colId !== 'select' && colId !== 'actions' && !processedIds.has(colId)) {
          unorderedColumns.push(col)
        }
      })
      
      // For mobile, keep actions and select at the beginning
      if (isMobile) {
        const selectColumn = allColumnsMap.get('select')
        const actionsColumn = allColumnsMap.get('actions')
        const result: ColumnDef<CollectionData>[] = []
        if (actionsColumn) result.push(actionsColumn)
        if (selectColumn) result.push(selectColumn)
        result.push(...orderedColumns, ...unorderedColumns)
        return result
      } else {
        // For desktop, keep select at the beginning, actions at the end
        const selectColumn = allColumnsMap.get('select')
        const actionsColumn = allColumnsMap.get('actions')
        const result: ColumnDef<CollectionData>[] = []
        if (selectColumn) result.push(selectColumn)
        result.push(...orderedColumns, ...unorderedColumns)
        if (actionsColumn) result.push(actionsColumn)
        return result
      }
    } else {
      // No saved order - use default reordering
      let otherColumns = columns.filter(col => col.id !== 'select' && col.id !== 'actions')
      
      // For contractors, set default column order: ID, Логотип (media_id), Название (title), Рег. № (reg), ИНН (tin), Статус (status_name), Город (city_name)
      if (state.collection === 'contractors') {
        const defaultOrder = ['id', 'media_id', 'title', 'reg', 'tin', 'status_name', 'city_name']
        const ordered: ColumnDef<CollectionData>[] = []
        const unordered: ColumnDef<CollectionData>[] = []
        const processedIds = new Set<string>()
        
        // Add columns in default order
        for (const colId of defaultOrder) {
          const col = otherColumns.find(c => c.id === colId)
          if (col && col.id) {
            ordered.push(col)
            processedIds.add(col.id)
          }
        }
        
        // Add remaining columns
        otherColumns.forEach(col => {
          if (col.id && !processedIds.has(col.id)) {
            unordered.push(col)
          }
        })
        
        otherColumns = [...ordered, ...unordered]
      }
      
      if (isMobile) {
        const selectColumn = allColumnsMap.get('select')
        const actionsColumn = allColumnsMap.get('actions')
        const result: ColumnDef<CollectionData>[] = []
        if (actionsColumn) result.push(actionsColumn)
        if (selectColumn) result.push(selectColumn)
        result.push(...otherColumns)
        return result
      } else {
        // Desktop: select first, actions last
        const selectColumn = allColumnsMap.get('select')
        const actionsColumn = allColumnsMap.get('actions')
        const result: ColumnDef<CollectionData>[] = []
        if (selectColumn) result.push(selectColumn)
        result.push(...otherColumns)
        if (actionsColumn) result.push(actionsColumn)
        return result
      }
    }
  }, [columns, isMobile, columnOrder, state.collection])
  
  // Save column order to localStorage
  React.useEffect(() => {
    if (state.collection && typeof window !== 'undefined' && columnOrder.length > 0) {
      try {
        localStorage.setItem(`column-order-${state.collection}`, JSON.stringify(columnOrder))
      } catch (e) {
        console.warn('Failed to save column order to localStorage:', e)
      }
    }
  }, [columnOrder, state.collection])
  
  // Sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  // Sortable column item component
  function SortableColumnItem({ id, children }: { id: string; children: React.ReactNode }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id })
    
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }
    
    return (
      <div ref={setNodeRef} style={style} {...attributes}>
        <div className="flex items-center gap-1">
          <div
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          >
            <IconGripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          {children}
        </div>
      </div>
    )
  }

  // Restore column sizing when collection or device type changes
  React.useEffect(() => {
    if (!state.collection || typeof window === 'undefined') return
    try {
      const isMobileDevice = window.innerWidth < 1024
      const key = isMobileDevice 
        ? `column-sizes-mobile-${state.collection}` 
        : `column-sizes-desktop-${state.collection}`
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object') {
          setColumnSizing(parsed)
        } else {
          setColumnSizing({})
        }
      } else {
        setColumnSizing({})
      }
    } catch (e) {
      console.warn('Failed to restore column sizing:', e)
      setColumnSizing({})
    }
  }, [state.collection, isMobile])

  // Save column sizes to localStorage - separate for mobile and desktop
  React.useEffect(() => {
    if (state.collection && typeof window !== 'undefined' && Object.keys(columnSizing).length > 0) {
      try {
        const isMobileDevice = window.innerWidth < 1024
        const key = isMobileDevice 
          ? `column-sizes-mobile-${state.collection}` 
          : `column-sizes-desktop-${state.collection}`
        localStorage.setItem(key, JSON.stringify(columnSizing))
      } catch (e) {
        console.error('Failed to save column sizes:', e)
      }
    }
  }, [columnSizing, state.collection, isMobile])

  
  

  const table = useReactTable({
    data: filteredData,
    columns: reorderedColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
      columnSizing,
    },
    pageCount: totalPages,
    manualPagination: true,
    enableRowSelection: true,
    enableMultiSort: true, // Enable multi-column sorting
    columnResizeMode: 'onChange',
    getRowId: (row) => {
      // Use primary key from schema, fallback to 'id' if not found
      const pkValue = row[primaryKey]
      return pkValue != null ? String(pkValue) : String(row.id ?? Math.random())
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  // Navigation helpers for edit form
  const currentRowIndex = React.useMemo(() => {
    if (!recordToEdit || !table) return -1
    const pkValue = recordToEdit[primaryKey]
    const rows = table.getRowModel().rows
    return rows.findIndex(row => row.original[primaryKey] === pkValue)
  }, [recordToEdit, table, primaryKey])
  
  const hasPreviousRecord = currentRowIndex > 0
  const hasNextRecord = currentRowIndex >= 0 && currentRowIndex < (table?.getRowModel().rows.length || 0) - 1
  
  const navigateToPrevious = React.useCallback(() => {
    if (!hasPreviousRecord || !table) return
    const rows = table.getRowModel().rows
    const previousRow = rows[currentRowIndex - 1]
    if (previousRow) {
      onEditRequest(previousRow)
    }
  }, [hasPreviousRecord, currentRowIndex, table, onEditRequest])
  
  const navigateToNext = React.useCallback(() => {
    if (!hasNextRecord || !table) return
    const rows = table.getRowModel().rows
    const nextRow = rows[currentRowIndex + 1]
    if (nextRow) {
      onEditRequest(nextRow)
    }
  }, [hasNextRecord, currentRowIndex, table, onEditRequest])

  async function handleConfirmDelete() {
    if (!recordToDelete) return
    const idValue = recordToDelete[primaryKey]
    try {
      const res = await fetch(`/api/admin/${encodeURIComponent(state.collection)}/${encodeURIComponent(String(idValue))}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`)
      setConfirmOpen(false)
      setRecordToDelete(null)
      await fetchData()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function handleBatchDelete() {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    if (selectedRows.length === 0) return
    
    setBatchDeleting(true)
    setError(null)
    
    try {
      // Delete each selected row
      for (const row of selectedRows) {
        const idValue = row.original[primaryKey]
        const res = await fetch(`/api/admin/${encodeURIComponent(state.collection)}/${encodeURIComponent(String(idValue))}`, {
          method: "DELETE",
          credentials: "include",
        })
        if (!res.ok) throw new Error(`Delete failed: ${res.status}`)
      }
      
      setBatchDeleteOpen(false)
      setRowSelection({}) // Clear selection
      await fetchData()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBatchDeleting(false)
    }
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCreateError(null)
    try {
      // Auto-populate XAID from selected expanse if not already set
      const hasXaidField = schema.some((col) => col.name === 'xaid')
      if (hasXaidField && state.collection !== 'expanses') {
        const xaidField = schema.find((col) => col.name === 'xaid')
        // For readOnly fields, still allow auto-population from expanse selector
        // Only skip if field is explicitly hidden
        if (xaidField && !xaidField.hidden) {
          if (typeof window !== 'undefined') {
            const selectedXaid = localStorage.getItem('selected-expanse-xaid')
            if (selectedXaid && selectedXaid.trim() !== '') {
              // Override formData.xaid with selected expanse xaid if it's empty or not set
              if (!formData.xaid || formData.xaid === '') {
                formData.xaid = selectedXaid
              }
            } else {
              // If "Общее" is selected, ensure xaid is not set
              if (formData.xaid) {
                delete formData.xaid
              }
            }
          }
        }
      }

      // Normalize payload for API: handle taxonomy translations, JSON, prices, and Date values
      const payload = Object.entries(formData).reduce((acc, [key, value]) => {
        const i18nFields = getI18nJsonFieldsForCollection(state.collection)
        const i18nMatch = key.match(/^(.+)_([a-z]{2})$/)
        if (i18nMatch) {
          const baseField = i18nMatch[1]
          const lang = i18nMatch[2] as LanguageCode
          if (i18nFields.includes(baseField) && enabledLanguageCodes.includes(lang)) {
            const existing = (acc[baseField] as Record<string, string>) || {}
            acc[baseField] = { ...existing, [lang]: (value as string) || '' }
            return acc
          }
        }

        // Skip any helper fields for i18n json inputs
        if (i18nMatch && enabledLanguageCodes.includes(i18nMatch[2] as LanguageCode)) {
          const baseField = i18nMatch[1]
          if (getI18nJsonFieldsForCollection(state.collection).includes(baseField)) {
            return acc
          }
        }

        const field = schema.find((f) => f.name === key)

        // For relation fields, ensure we pass the value as-is (ID, not creating new record)
        if (field?.relation) {
          // RelationSelect returns the value, but we need to ensure it's a primitive (ID), not an object
          // If value is empty string, convert to null for nullable fields
          if (value === '' && field.nullable) {
            acc[key] = null
          } else if (value !== '' && value != null) {
            // Ensure we only pass primitive values (string, number), not objects
            // If value is an object, extract the ID field
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              // This shouldn't happen, but if it does, try to extract the ID
              console.warn(`[handleCreateSubmit] Relation field ${key} has object value, extracting ID:`, value)
              const idValue = (value as any)[field.relation.valueField] || (value as any).id || (value as any)[primaryKey]
              acc[key] = idValue != null ? idValue : null
            } else {
              // Pass primitive value as-is (this should be the ID of the existing record)
              console.log(`[handleCreateSubmit] Relation field ${key} value:`, value, typeof value)
              acc[key] = value
            }
          } else if (!field.nullable && value === '') {
            // Skip required fields that are empty (will be validated on server)
            return acc
          } else {
            acc[key] = value
          }
        } else if (field?.fieldType === 'json' && value != null && typeof value === 'object' && !(value instanceof Date)) {
          acc[key] = value // Keep as object, server will stringify
        } else if (field?.fieldType === 'price') {
          if (value != null && typeof value === 'number') {
            acc[key] = value
          } else if (value === null && field.nullable) {
            acc[key] = null
          }
        } else if (value instanceof Date && typeof value.toISOString === 'function') {
          acc[key] = value.toISOString()
        } else {
          acc[key] = value
        }

        return acc
      }, {} as Record<string, any>)
      
        // Process data_in entries - entriesToLanguageObject already returns the correct structure with title and value
        const processedDataIn = entriesToLanguageObject(createDataInEntries)
      
      // Always add data_in to payload (even if empty, to allow clearing it)
      payload.data_in = processedDataIn
      
      // Log payload to debug relation field issues
      console.log('[handleCreateSubmit] Payload before sending:', JSON.stringify(payload, null, 2))
      
      const res = await fetch(`/api/admin/${encodeURIComponent(state.collection)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const json = await res.json() as { error?: string }
        throw new Error(json.error || `Create failed: ${res.status}`)
      }
      setCreateOpen(false)
      setFormData({})
      // Clear price inputs for create form
      setPriceInputs(prev => {
        const newInputs = { ...prev }
        editableFields.forEach(field => {
          if (field.fieldType === 'price') {
            delete newInputs[`create-${field.name}`]
          }
        })
        return newInputs
      })
      await fetchData()
    } catch (e) {
      setCreateError((e as Error).message)
    }
  }

  const handleFieldChange = React.useCallback((fieldName: string, value: string | boolean | Date | number | null) => {
    setFormData((prev: Record<string, any>) => ({ ...prev, [fieldName]: value }))
  }, [])

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!recordToEdit) return
    
    // If this is a duplicate, create a new record instead of updating
    if (isDuplicate) {
    setEditError(null)
    try {
      // Normalize payload for API: handle taxonomy translations, JSON, prices, and Date values
      const payload = Object.entries(editData).reduce((acc, [key, value]) => {
        const i18nFields = getI18nJsonFieldsForCollection(state.collection)
        const i18nMatch = key.match(/^(.+)_([a-z]{2})$/)
        if (i18nMatch) {
          const baseField = i18nMatch[1]
            const lang = i18nMatch[2] as LanguageCode
          if (i18nFields.includes(baseField) && enabledLanguageCodes.includes(lang)) {
            const existing = (acc[baseField] as Record<string, string>) || {}
            acc[baseField] = { ...existing, [lang]: (value as string) || '' }
            return acc
          }
        }

        // Skip any helper fields for i18n json inputs
          if (i18nMatch && enabledLanguageCodes.includes(i18nMatch[2] as LanguageCode)) {
          const baseField = i18nMatch[1]
          if (getI18nJsonFieldsForCollection(state.collection).includes(baseField)) {
            return acc
          }
        }

        const field = schema.find((f) => f.name === key)

        // For relation fields, ensure we pass the value as-is (ID, not creating new record)
        if (field?.relation) {
          // RelationSelect returns the value, but we need to ensure it's a primitive (ID), not an object
          // If value is empty string, convert to null for nullable fields
          if (value === '' && field.nullable) {
            acc[key] = null
          } else if (value !== '' && value != null) {
            // Ensure we only pass primitive values (string, number), not objects
            // If value is an object, extract the ID field
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              // This shouldn't happen, but if it does, try to extract the ID
              console.warn(`[handleCreateSubmit] Relation field ${key} has object value, extracting ID:`, value)
              const idValue = (value as any)[field.relation.valueField] || (value as any).id || (value as any)[primaryKey]
              acc[key] = idValue != null ? idValue : null
            } else {
              // Pass primitive value as-is (this should be the ID of the existing record)
              console.log(`[handleCreateSubmit] Relation field ${key} value:`, value, typeof value)
              acc[key] = value
            }
          } else if (!field.nullable && value === '') {
            // Skip required fields that are empty (will be validated on server)
            return acc
          } else {
            acc[key] = value
          }
        } else if (field?.fieldType === 'json' && value != null && typeof value === 'object' && !(value instanceof Date)) {
          acc[key] = value // Keep as object, server will stringify
        } else if (field?.fieldType === 'price') {
          if (value != null && typeof value === 'number') {
            acc[key] = value
          } else if (value === null && field.nullable) {
            acc[key] = null
          }
        } else if (value instanceof Date && typeof value.toISOString === 'function') {
          acc[key] = value.toISOString()
        } else {
          acc[key] = value
        }

        return acc
      }, {} as Record<string, any>)
        
        // Process data_in entries with language support for all fields
        const dataInObj = entriesToLanguageObject(editDataInEntries)
        const processedDataIn: Record<string, any> = {}
        const languageFields: Record<string, Record<string, string>> = {} // field_name -> { en: "...", ru: "...", rs: "..." }
        const plainFields: Record<string, any> = {} // field_name -> value (without language suffix)
        
        for (const [key, value] of Object.entries(dataInObj)) {
          // Check if key matches field_name_<lang> pattern
          const langMatch = key.match(/^(.+)_([a-z]{2})$/i)
          if (langMatch && enabledLanguageCodes.includes(langMatch[2].toLowerCase() as LanguageCode)) {
            const fieldName = langMatch[1]
            const lang = langMatch[2].toLowerCase()
            if (!languageFields[fieldName]) {
              languageFields[fieldName] = {}
            }
            languageFields[fieldName][lang] = typeof value === 'string' ? value : JSON.stringify(value)
          } else {
            // Plain field without language suffix
            plainFields[key] = value
          }
        }
        
        // Convert language fields to objects
        for (const [fieldName, langValues] of Object.entries(languageFields)) {
          processedDataIn[fieldName] = langValues
        }
        
        // Convert plain fields to language objects (create entries for all languages)
        for (const [fieldName, value] of Object.entries(plainFields)) {
          // Skip if this field already has language entries
          if (!languageFields[fieldName]) {
            const fieldValue = typeof value === 'string' ? value : JSON.stringify(value)
            const langObject: Record<string, string> = {}
            for (const lang of enabledLanguageCodes) {
              langObject[lang] = fieldValue
            }
            processedDataIn[fieldName] = langObject
          } else {
            // Field has language entries, skip plain value
            continue
          }
        }
        
        // Always add data_in to payload (even if empty, to allow clearing it)
        payload.data_in = processedDataIn
        
        // Log payload to debug relation field issues
        console.log('[handleEditSubmit] Duplicate payload before sending:', JSON.stringify(payload, null, 2))
        
        const res = await fetch(`/api/admin/${encodeURIComponent(state.collection)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const json = await res.json() as { error?: string }
          throw new Error(json.error || `Create failed: ${res.status}`)
        }
        setEditOpen(false)
        setRecordToEdit(null)
        setEditData({})
        setIsDuplicate(false)
        // Clear price inputs for edit form
        setPriceInputs(prev => {
          const newInputs = { ...prev }
          schema.filter((f) => !isAutoGeneratedField(f.name, !!f.relation) && !f.primary && !f.hidden).forEach(field => {
            if (field.fieldType === 'price') {
              delete newInputs[`edit-${field.name}`]
            }
          })
          return newInputs
        })
        await fetchData()
        return
      } catch (e) {
        setEditError((e as Error).message)
        return
      }
    }
    setEditError(null)
    try {
      // Normalize payload for API: handle taxonomy translations, JSON, prices, and Date values
      const payload = Object.entries(editData).reduce((acc, [key, value]) => {
        const i18nFields = getI18nJsonFieldsForCollection(state.collection)
        const i18nMatch = key.match(/^(.+)_([a-z]{2})$/)
        if (i18nMatch) {
          const baseField = i18nMatch[1]
          const lang = i18nMatch[2] as LanguageCode
          if (i18nFields.includes(baseField) && enabledLanguageCodes.includes(lang)) {
            const existing = (acc[baseField] as Record<string, string>) || {}
            acc[baseField] = { ...existing, [lang]: (value as string) || '' }
            return acc
          }
        }

        // Skip any helper fields for i18n json inputs
        if (i18nMatch && enabledLanguageCodes.includes(i18nMatch[2] as LanguageCode)) {
          const baseField = i18nMatch[1]
          if (getI18nJsonFieldsForCollection(state.collection).includes(baseField)) {
            return acc
          }
        }

        const field = schema.find((f) => f.name === key)

        if (field?.fieldType === 'json' && value != null && typeof value === 'object' && !(value instanceof Date)) {
          acc[key] = value // Keep as object, server will stringify
        } else if (field?.fieldType === 'price') {
          if (value != null && typeof value === 'number') {
            acc[key] = value
          } else if (value === null && field.nullable) {
            acc[key] = null
          }
        } else if (value instanceof Date && typeof value.toISOString === 'function') {
          acc[key] = value.toISOString()
        } else {
          acc[key] = value
        }

        return acc
      }, {} as Record<string, any>)
      
      // Process data_in entries - entriesToLanguageObject already returns the correct structure with title and value
      const processedDataIn = entriesToLanguageObject(editDataInEntries)
      
      // Always add data_in to payload (even if empty, to allow clearing it)
      payload.data_in = processedDataIn
      
      // Log payload to debug relation field issues
      console.log('[handleEditSubmit] Payload before sending:', JSON.stringify(payload, null, 2))
      
      const idValue = recordToEdit[primaryKey]
      const res = await fetch(`/api/admin/${encodeURIComponent(state.collection)}/${encodeURIComponent(String(idValue))}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const json = await res.json() as { error?: string }
        throw new Error(json.error || `Update failed: ${res.status}`)
      }
      setEditOpen(false)
      setRecordToEdit(null)
      setEditData({})
      setIsDuplicate(false)
      // Clear price inputs for edit form
      setPriceInputs(prev => {
        const newInputs = { ...prev }
        schema.filter((f) => !isAutoGeneratedField(f.name, !!f.relation) && !f.primary && !f.hidden).forEach(field => {
          if (field.fieldType === 'price') {
            delete newInputs[`edit-${field.name}`]
          }
        })
        return newInputs
      })
      await fetchData()
    } catch (e) {
      setEditError((e as Error).message)
    }
  }

  // Handle export
  const handleExport = React.useCallback((format: ExportFormat) => {
    // Get filtered and sorted rows (respects current table state)
    const rows = table.getFilteredRowModel().rows
    
    // Get visible column order from table (only columns that are actually visible)
    const columnOrder = table.getAllColumns()
      .filter(col => col.getIsVisible() && col.id !== 'select')
      .map(col => col.id)
    
    // Export with current state
    const exported = exportTable({
      collection: state.collection || '',
      format,
      rows,
      columns: schema,
      visibleColumns: columnVisibility,
      locale,
      relationData,
      columnOrder,
      translations,
    })
    
    setExportData(exported)
    setExportFormat(format)
    setExportOpen(true)
    setExportCopied(false)
  }, [table, state.collection, schema, columnVisibility, locale, relationData, translations])

  const handleExportCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(exportData)
      setExportCopied(true)
      setTimeout(() => setExportCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [exportData])

  const handleExportDownload = React.useCallback(() => {
    // Add BOM for CSV and XLS files to ensure proper UTF-8 encoding in Excel
    const dataToDownload = (exportFormat === 'csv' || exportFormat === 'xls') ? addBOM(exportData) : exportData
    const blob = new Blob([dataToDownload], { type: getMimeType(exportFormat) })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${state.collection || 'export'}_${new Date().toISOString().split('T')[0]}.${getFileExtension(exportFormat)}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [exportData, exportFormat, state.collection])

  // Handle import
  const handleImportFileSelect = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setImportFile(file)
    // Detect format from file extension
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'csv') {
      setImportFormat('csv')
    } else if (ext === 'xls' || ext === 'xlsx') {
      setImportFormat('xls')
    } else if (ext === 'json') {
      setImportFormat('json')
    } else if (ext === 'sql') {
      setImportFormat('sql')
    }
  }, [])

  const handleImport = React.useCallback(async () => {
    if (!state.collection) return
    if (importMode === 'file' && !importFile) return
    if (importMode === 'paste' && !importText.trim()) return
    
    setImporting(true)
    setImportResult(null)
    setImportProgress({ imported: 0, total: 0 })
    
    try {
      const content = importMode === 'file' 
        ? await importFile!.text()
        : importText
      const rows = parseImportFile(content, importFormat, state.collection)
      
      if (rows.length === 0) {
        setImportResult({
          success: false,
          imported: 0,
          errors: [t.importNoData]
        })
        setImporting(false)
        return
      }
      
      setImportProgress({ imported: 0, total: rows.length })
      
      const result = await importRows(
        state.collection,
        rows,
        (imported, total) => setImportProgress({ imported, total })
      )
      
      setImportResult(result)
      
      if (result.success || result.imported > 0) {
        // Refresh data after successful import
        const controller = new AbortController()
        const isMounted = { current: true }
        await fetchData(controller.signal, isMounted)
      }
    } catch (e) {
      setImportResult({
        success: false,
        imported: 0,
        errors: [e instanceof Error ? e.message : t.importError]
      })
    } finally {
      setImporting(false)
    }
  }, [importFile, importText, importMode, importFormat, state.collection])

  const handleImportClose = React.useCallback(() => {
    setImportOpen(false)
    setImportFile(null)
    setImportText('')
    setImportMode('file')
    setImportResult(null)
    setImportProgress({ imported: 0, total: 0 })
    setImporting(false)
  }, [])
  
  const handleImportDialogChange = React.useCallback((open: boolean) => {
    if (!open) {
      setImportOpen(false)
      setImportFile(null)
      setImportText('')
      setImportMode('file')
      setImportResult(null)
      setImportProgress({ imported: 0, total: 0 })
      setImporting(false)
    } else {
      setImportOpen(true)
    }
  }, [])

  return (
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center gap-2 px-0">
        {/* Date Filter Button */}
        {filterSettings.dateFilter && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="bg-primary-foreground h-9 text-xs">
              <IconCalendar className="h-4 w-4" />
              <span className="hidden lg:inline">{dateFilter.type && dateFilter.range ? (dateFilter.type === 'created_at' ? (t.dateFilter?.created || 'Created') : (t.dateFilter?.updated || 'Updated')) : (t.dateFilter?.filter || 'По дате')}</span>
              {dateFilter.type && dateFilter.range && (
                <IconX 
                  className="h-3 w-3 ml-1 cursor-pointer hover:opacity-70" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    clearDateFilter()
                  }}
                />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>{t.dateFilter?.filterBy || 'Filter by'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                {t.dateFilter?.created || 'Created'}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-auto min-w-[280px]">
                <DropdownMenuItem onClick={() => applyDateFilter('created_at', 'today')}>
                  {t.dateFilter?.today || 'Today'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyDateFilter('created_at', 'yesterday')}>
                  {t.dateFilter?.yesterday || 'Yesterday'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyDateFilter('created_at', 'last7days')}>
                  {t.dateFilter?.last7days || 'Last 7 days'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyDateFilter('created_at', 'last30days')}>
                  {t.dateFilter?.last30days || 'Last 30 days'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyDateFilter('created_at', 'last90days')}>
                  {t.dateFilter?.last90days || 'Last 90 days'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyDateFilter('created_at', 'thisMonth')}>
                  {t.dateFilter?.thisMonth || 'This month'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyDateFilter('created_at', 'lastMonth')}>
                  {t.dateFilter?.lastMonth || 'Last month'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyDateFilter('created_at', 'thisYear')}>
                  {t.dateFilter?.thisYear || 'This year'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyDateFilter('created_at', 'lastYear')}>
                  {t.dateFilter?.lastYear || 'Last year'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{t.dateFilter?.selectDate || 'Select date'}</DropdownMenuLabel>
                <div className="px-2 py-1.5">
                  <DateTimePicker
                    mode="date"
                    value={tempSingleDate.created || undefined}
                    onChange={(date) => {
                      if (date) {
                        setTempSingleDate(prev => ({ ...prev, created: date }))
                        applyDateFilter('created_at', 'single', undefined, undefined, date)
                      }
                    }}
                  />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{t.dateFilter?.dateRange || 'Date range'}</DropdownMenuLabel>
                <div className="px-2 py-1.5">
                  <DayPicker
                    mode="range"
                    selected={tempDateRange.created}
                    onSelect={(range) => {
                      setTempDateRange(prev => ({
                        ...prev,
                        created: range
                      }))
                      if (range?.from && range.to) {
                        applyDateFilter('created_at', 'custom', range.from, range.to)
                      }
                    }}
                    locale={dateFnsLocale}
                    numberOfMonths={2}
                    classNames={{
                      months: "flex flex-col sm:flex-row space-y-2 sm:space-x-2 sm:space-y-0",
                      month: "space-y-2",
                      caption: "flex justify-center pt-1 relative items-center mb-1",
                      caption_label: "text-xs font-medium",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-0.5",
                      head_row: "flex",
                      head_cell: "text-muted-foreground rounded-md w-7 font-normal text-[0.7rem]",
                      row: "flex w-full mt-1",
                      cell: "h-7 w-7 text-center text-xs p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      day: "h-7 w-7 p-0 font-normal aria-selected:opacity-100 text-xs",
                      day_range_end: "day-range-end",
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                      day_today: "bg-accent text-accent-foreground",
                      day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                      day_disabled: "text-muted-foreground opacity-50",
                      day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      day_hidden: "invisible",
                      range_end: "day-range-end",
                      range_start: "day-range-start"
                    }}
                  />
                </div>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                {t.dateFilter?.updated || 'Updated'}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-auto min-w-[280px]">
                <DropdownMenuItem onClick={() => applyDateFilter('updated_at', 'today')}>
                  {t.dateFilter?.today || 'Today'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyDateFilter('updated_at', 'yesterday')}>
                  {t.dateFilter?.yesterday || 'Yesterday'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyDateFilter('updated_at', 'last7days')}>
                  {t.dateFilter?.last7days || 'Last 7 days'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyDateFilter('updated_at', 'last30days')}>
                  {t.dateFilter?.last30days || 'Last 30 days'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyDateFilter('updated_at', 'last90days')}>
                  {t.dateFilter?.last90days || 'Last 90 days'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyDateFilter('updated_at', 'thisMonth')}>
                  {t.dateFilter?.thisMonth || 'This month'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyDateFilter('updated_at', 'lastMonth')}>
                  {t.dateFilter?.lastMonth || 'Last month'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyDateFilter('updated_at', 'thisYear')}>
                  {t.dateFilter?.thisYear || 'This year'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyDateFilter('updated_at', 'lastYear')}>
                  {t.dateFilter?.lastYear || 'Last year'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{t.dateFilter?.selectDate || 'Select date'}</DropdownMenuLabel>
                <div className="px-2 py-1.5">
                  <DateTimePicker
                    mode="date"
                    value={tempSingleDate.updated || undefined}
                    onChange={(date) => {
                      if (date) {
                        setTempSingleDate(prev => ({ ...prev, updated: date }))
                        applyDateFilter('updated_at', 'single', undefined, undefined, date)
                      }
                    }}
                  />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{t.dateFilter?.dateRange || 'Date range'}</DropdownMenuLabel>
                <div className="px-2 py-1.5">
                  <DayPicker
                    mode="range"
                    selected={tempDateRange.updated}
                    onSelect={(range) => {
                      setTempDateRange(prev => ({
                        ...prev,
                        updated: range
                      }))
                      if (range?.from && range.to) {
                        applyDateFilter('updated_at', 'custom', range.from, range.to)
                      }
                    }}
                    locale={dateFnsLocale}
                    numberOfMonths={2}
                    classNames={{
                      months: "flex flex-col sm:flex-row space-y-2 sm:space-x-2 sm:space-y-0",
                      month: "space-y-2",
                      caption: "flex justify-center pt-1 relative items-center mb-1",
                      caption_label: "text-xs font-medium",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-0.5",
                      head_row: "flex",
                      head_cell: "text-muted-foreground rounded-md w-7 font-normal text-[0.7rem]",
                      row: "flex w-full mt-1",
                      cell: "h-7 w-7 text-center text-xs p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      day: "h-7 w-7 p-0 font-normal aria-selected:opacity-100 text-xs",
                      day_range_end: "day-range-end",
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                      day_today: "bg-accent text-accent-foreground",
                      day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                      day_disabled: "text-muted-foreground opacity-50",
                      day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      day_hidden: "invisible",
                      range_end: "day-range-end",
                      range_start: "day-range-start"
                    }}
                  />
                </div>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            {dateFilter.type && dateFilter.range && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={clearDateFilter}>
                  {t.dateFilter?.clear || 'Clear filter'}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        )}
        
        {/* Status Filter Button (only for contractors collection) - Multiselect */}
        {filterSettings.statusFilter && state.collection === 'contractors' && statusOptions.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="bg-primary-foreground h-9 text-xs">
                <IconTag className="h-4 w-4" />
                <span className="hidden lg:inline">
                  {statusFilter.length > 0
                    ? `${statusFilter.length} ${statusFilter.length === 1 ? (t.statusFilter?.selected || 'выбран') : (t.statusFilter?.selectedPlural || 'выбрано')}`
                    : (t.statusFilter?.filter || 'По статусу')
                  }
                </span>
                {statusFilter.length > 0 && (
                  <IconX 
                    className="h-3 w-3 ml-1 cursor-pointer hover:opacity-70" 
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      clearStatusFilter()
                    }}
                  />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-0 z-10002">
              <Command>
                <CommandInput placeholder={t?.search || "Search..."} className="h-8" />
                <CommandList>
                  <CommandEmpty>{t?.form?.noResults || "No results found."}</CommandEmpty>
                  <CommandGroup>
                    {statusOptions.map((option) => {
                      const isSelected = statusFilter.includes(option.value)
                      return (
                        <CommandItem
                          key={option.value}
                          value={`${option.label} ${option.value}`}
                          onSelect={() => {
                            if (isSelected) {
                              applyStatusFilter(statusFilter.filter((v) => v !== option.value))
                            } else {
                              applyStatusFilter([...statusFilter, option.value])
                            }
                          }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{option.label}</span>
                            {isSelected && <IconCheck className="h-4 w-4 ml-auto" />}
                          </div>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
              {statusFilter.length > 0 && (
                <>
                  <div className="border-t p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={clearStatusFilter}
                    >
                      {t.statusFilter?.clear || 'Clear filter'}
                    </Button>
                  </div>
                </>
              )}
          </PopoverContent>
        </Popover>
        )}
        
        {/* City Filter Button (only for contractors collection) - Multiselect */}
        {filterSettings.cityFilter && state.collection === 'contractors' && cityOptions.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="bg-primary-foreground h-9 text-xs">
                <IconMapPin className="h-4 w-4" />
                <span className="hidden lg:inline">
                  {cityFilter.length > 0
                    ? `${cityFilter.length} ${cityFilter.length === 1 ? (t.cityFilter?.selected || 'выбран') : (t.cityFilter?.selectedPlural || 'выбрано')}`
                    : (t.cityFilter?.filter || 'По городу')
                  }
                </span>
                {cityFilter.length > 0 && (
                  <IconX 
                    className="h-3 w-3 ml-1 cursor-pointer hover:opacity-70" 
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      clearCityFilter()
                    }}
                  />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-0 z-10002">
              <Command>
                <CommandInput placeholder={t?.search || "Search..."} className="h-8" />
                <CommandList>
                  <CommandEmpty>{t?.form?.noResults || "No results found."}</CommandEmpty>
                  <CommandGroup>
                    {cityOptions.map((option) => {
                      const isSelected = cityFilter.includes(option.value)
                      return (
                        <CommandItem
                          key={option.value}
                          value={`${option.label} ${option.value}`}
                          onSelect={() => {
                            if (isSelected) {
                              applyCityFilter(cityFilter.filter((v) => v !== option.value))
                            } else {
                              applyCityFilter([...cityFilter, option.value])
                            }
                          }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{option.label}</span>
                            {isSelected && <IconCheck className="h-4 w-4 ml-auto" />}
                          </div>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
              {cityFilter.length > 0 && (
                <>
                  <div className="border-t p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={clearCityFilter}
                    >
                      {t.cityFilter?.clear || 'Clear filter'}
                    </Button>
                  </div>
                </>
              )}
            </PopoverContent>
          </Popover>
        )}
        
        {/* Search Field */}
        <div className="relative w-full lg:max-w-2xl">
          <div className="relative flex items-center gap-1 h-9 rounded-md border bg-primary-foreground px-3 shadow-xs">
            <IconSearch className="size-4 shrink-0 text-muted-foreground" />
            <div className="flex flex-wrap items-center gap-1 flex-1 min-w-0">
              {searchConditions.map((condition, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="text-xs px-2 py-0.5 h-6 flex items-center gap-1 shrink-0"
                >
                  <span>
                    {condition.type === 'exact' ? `"${condition.value}"` : condition.value}
                    {condition.operator && ` ${condition.operator}`}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      const newConditions = searchConditions.filter((_, i) => i !== idx)
                      setSearchConditions(newConditions)
                      // Update global search state
                      const searchString = newConditions.map(c => 
                        c.type === 'exact' ? `"${c.value}"` : c.value
                      ).join(' ')
                      setState(prev => ({ ...prev, search: searchString, page: 1 }))
                      // Reload data if operators are still present
                      if (newConditions.some(c => c.operator)) {
                        void fetchData()
                      } else if (newConditions.length === 0) {
                        // No conditions left - reload without search
                        void fetchData()
                      }
                    }}
                    className="ml-1 hover:bg-muted rounded-full p-0.5 -mr-1"
                  >
                    <IconX className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Input
                type="text"
                placeholder={searchConditions.length === 0 ? (t.search + (t.searchHint ? ` (${t.searchHint})` : '')) : ''}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchInput.trim()) {
                    e.preventDefault()
                    const parsed = parseSearchQuery(searchInput.trim())
                    if (parsed.conditions.length > 0) {
                      const newConditions = [...searchConditions, ...parsed.conditions]
                      setSearchConditions(newConditions)
                      setSearchInput('')
                      // Update global search state with combined conditions
                      const searchString = newConditions.map(c => 
                        c.type === 'exact' ? `"${c.value}"` : c.value
                      ).join(' ')
                      setState(prev => ({ ...prev, search: searchString, page: 1 }))
                      // Reload data if operators are present (to get all data for client-side filtering)
                      if (newConditions.some(c => c.operator)) {
                        void fetchData()
                      }
                    }
                  }
                }}
                className="border-0 p-0 h-9 flex-1 min-w-[120px] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none bg-transparent"
              />
            </div>
          </div>
        </div>
        
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <div className="flex items-center gap-1 lg:gap-2 ml-auto">
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <Button 
              variant="destructive" 
              size="sm" 
              className="h-9"
              onClick={() => setBatchDeleteOpen(true)}
              disabled={batchDeleting}
            >
              <IconTrash />
              <span className="hidden lg:inline">{t.delete?.selected || "Delete Selected"}</span>
            </Button>
          )}
          <div className="hidden lg:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-primary-foreground h-9">
                  <IconDownload />
                  <span className="hidden lg:inline">{t.export}</span>
                  <IconChevronDown className="hidden lg:inline" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('xls')}>
                  Excel (XLS)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('sql')}>
                  SQL
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setImportOpen(true)}>
                  <IconUpload className="mr-2 h-4 w-4" />
                  {t.import}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Save button - only show in edit mode */}
            {editMode && hasUnsavedChanges && (
              <Button 
                variant="default" 
                size="sm" 
                className="bg-primary-foreground h-9 ml-2" 
                onClick={async () => {
                  try {
                    await handleSaveAllChanges()
                  } catch (e) {
                    console.error('Failed to save changes:', e)
                  }
                }}
              >
                <IconDeviceFloppy className="h-4 w-4" />
                <span className="hidden lg:inline">{t.save || "Save"}</span>
              </Button>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-primary-foreground h-9">
                <IconLayoutColumns />
                <span className="hidden lg:inline">{t.configureTable}</span>
                <IconChevronDown className="hidden lg:inline" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 max-h-[80vh] lg:max-h-[400px] overflow-y-auto">
              {(() => {
                // Get all columns (schema + data_in) for drag-and-drop
                const allTableColumns = table.getAllColumns()
                const schemaColumns = allTableColumns.filter(
                  (column) => {
                    // Must have an id
                    if (!column.id) return false
                    // Exclude system columns
                    if (column.id === 'select' || column.id === 'actions') return false
                    // Exclude data_in columns (they are handled separately)
                    if (column.id.startsWith('data_in.')) return false
                    // Must have either accessorFn or accessorKey (data columns)
                    const hasAccessor = typeof column.accessorFn !== "undefined" || 'accessorKey' in column
                    // Include all columns with accessors (don't check canHide as it might exclude valid columns)
                    return hasAccessor
                  }
                )
                
                // Get data_in columns
                const allDataInKeys = new Set<string>()
                data.forEach((row) => {
                  const dataIn = row.data_in
                  if (dataIn) {
                    try {
                      let parsed: any = dataIn
                      if (typeof dataIn === 'string') {
                        try {
                          parsed = JSON.parse(dataIn)
                        } catch (e) {
                          return
                        }
                      }
                      if (parsed && typeof parsed === 'object') {
                        Object.keys(parsed).forEach((key) => {
                          const langMatch = key.match(/^(.+)_([a-z]{2})$/i)
                          if (langMatch && supportedLanguageCodes.includes(langMatch[2].toLowerCase() as LanguageCode)) {
                            allDataInKeys.add(langMatch[1])
                          } else {
                            allDataInKeys.add(key)
                          }
                        })
                      }
                    } catch (e) {
                      // Ignore
                    }
                  }
                })
                
                const dataInColumnIds = Array.from(allDataInKeys).map(baseKey => `data_in.${baseKey}`)
                
                // Combine all column IDs
                // Get all schema column IDs (use id if available, otherwise use accessorKey or accessorFn result)
                const schemaColumnIds = schemaColumns
                  .map(col => {
                    if (col.id) return col.id
                    // TanStack Table uses accessorKey as id if id is not set
                    if ('accessorKey' in col && col.accessorKey) return col.accessorKey as string
                    return null
                  })
                  .filter((id): id is string => !!id)
                
                const allColumnIds = [
                  ...schemaColumnIds,
                  ...dataInColumnIds
                ]
                
                // Apply saved order or use default
                const orderedColumnIds = columnOrder.length > 0
                  ? (() => {
                      const ordered: string[] = []
                      const unordered: string[] = []
                      const orderSet = new Set(columnOrder)
                      
                      // Add columns in saved order
                      columnOrder.forEach(id => {
                        if (allColumnIds.includes(id)) {
                          ordered.push(id)
                        }
                      })
                      
                      // Add remaining columns
                      allColumnIds.forEach(id => {
                        if (!orderSet.has(id)) {
                          unordered.push(id)
                        }
                      })
                      
                      return [...ordered, ...unordered]
                    })()
                  : allColumnIds
                
                const handleDragEnd = (event: DragEndEvent) => {
                  const { active, over } = event
                  
                  if (over && active.id !== over.id) {
                    const oldIndex = orderedColumnIds.indexOf(active.id as string)
                    const newIndex = orderedColumnIds.indexOf(over.id as string)
                    
                    if (oldIndex !== -1 && newIndex !== -1) {
                      // Move the dragged column in the ordered list
                      const newOrderedIds = arrayMove(orderedColumnIds, oldIndex, newIndex)
                      
                      // Merge with existing columnOrder to preserve columns not in the drag list
                      // This ensures we don't lose columns that might not be in orderedColumnIds
                      const existingOrderSet = new Set(columnOrder)
                      const newOrderSet = new Set(newOrderedIds)
                      
                      // Start with the new order
                      const finalOrder = [...newOrderedIds]
                      
                      // Add any columns from existing order that aren't in the new order
                      columnOrder.forEach(id => {
                        if (!newOrderSet.has(id) && allColumnIds.includes(id)) {
                          finalOrder.push(id)
                        }
                      })
                      
                      // Add any columns from allColumnIds that aren't in either order
                      allColumnIds.forEach(id => {
                        if (!existingOrderSet.has(id) && !newOrderSet.has(id)) {
                          finalOrder.push(id)
                        }
                      })
                      
                      setColumnOrder(finalOrder)
                    }
                  }
                }
                
                return (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={orderedColumnIds}
                      strategy={verticalListSortingStrategy}
                    >
                      {orderedColumnIds.map((columnId) => {
                        const isDataIn = columnId.startsWith('data_in.')
                        // Try to find column - first in schemaColumns, then in all table columns
                        let column = isDataIn
                          ? table.getAllColumns().find(col => col.id === columnId)
                          : schemaColumns.find(col => col.id === columnId)
                        
                        // If not found in schemaColumns, try all table columns
                        if (!column && !isDataIn) {
                          column = table.getAllColumns().find(col => col.id === columnId)
                        }
                        
                        if (!column && !isDataIn) {
                          console.warn(`[Column Settings] Column ${columnId} not found in schemaColumns or table columns`)
                          return null
                        }
                        
                        if (isDataIn) {
                          // Data_in column
                          const baseKey = columnId.replace('data_in.', '')
                          let fieldTitle: string | null = null
                          if (data && data.length > 0) {
                            for (const row of data) {
                              const dataIn = row.data_in
                              if (dataIn) {
                                try {
                                  let parsed: any = dataIn
                                  if (typeof dataIn === 'string') {
                                    try {
                                      parsed = JSON.parse(dataIn)
                                    } catch (e) {
                                      continue
                                    }
                                  }
                                  if (parsed && typeof parsed === 'object') {
                                    const foundKey = Object.keys(parsed).find(key => {
                                      const langMatch = key.match(/^(.+)_([a-z]{2})$/i)
                                      if (langMatch && langMatch[1].toLowerCase() === baseKey.toLowerCase()) {
                                        return true
                                      }
                                      return key.toLowerCase() === baseKey.toLowerCase()
                                    })
                                    if (foundKey && parsed[foundKey] !== undefined) {
                                      const value = parsed[foundKey]
                                      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                                        const localeValue = value[locale] || value.en || value.ru || value.rs || null
                                        if (localeValue !== null && localeValue !== undefined && typeof localeValue === 'object' && 'title' in localeValue) {
                                          fieldTitle = localeValue.title || null
                                          if (fieldTitle) break
                                        }
                                      }
                                    }
                                  }
                                } catch (e) {
                                  continue
                                }
                              }
                            }
                          }
                          const fieldTranslation = (translations as any)?.dataTable?.fields?.[state.collection]?.[baseKey]
                          const columnTitle = fieldTitle || fieldTranslation || baseKey
                          const isVisible = columnVisibility[columnId] !== false
                          const dataInColumn = table.getAllColumns().find(col => col.id === columnId)
                          const canSort = dataInColumn?.getCanSort() ?? false
                          const defaultSortForColumn = defaultSorting.find(s => s.id === columnId)
                          const sortValue = defaultSortForColumn ? (defaultSortForColumn.desc ? 'desc' : 'asc') : 'none'
                          
                          return (
                            <SortableColumnItem key={columnId} id={columnId}>
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="flex-1">
                                  <div className="flex items-center justify-between w-full">
                                    <span>{columnTitle}</span>
                                    <div className="flex items-center gap-1 ml-2">
                                      {isVisible && (
                                        <IconCheck className="h-3 w-3" />
                                      )}
                                      {defaultSortForColumn && (
                                        defaultSortForColumn.desc ? (
                                          <IconArrowDown className="h-3 w-3 opacity-50" />
                                        ) : (
                                          <IconArrowUp className="h-3 w-3 opacity-50" />
                                        )
                                      )}
                                    </div>
                                  </div>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  <DropdownMenuCheckboxItem
                                    checked={isVisible}
                                    onCheckedChange={(value) => {
                                      setColumnVisibility((prev) => ({
                                        ...prev,
                                        [columnId]: !!value
                                      }))
                                    }}
                                  >
                                    {t.showColumn}
                                  </DropdownMenuCheckboxItem>
                                  {canSort && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuLabel>{t.defaultSorting}</DropdownMenuLabel>
                                      <DropdownMenuRadioGroup
                                        value={sortValue}
                                        onValueChange={(value) => {
                                          if (value === 'none') {
                                            if (sorting.find((s: { id: string; desc: boolean }) => s.id === columnId)) {
                                              const newSorting = sorting.filter((s: { id: string; desc: boolean }) => s.id !== columnId)
                                              setSorting(newSorting)
                                            }
                                          } else {
                                            const newSort = { id: columnId, desc: value === 'desc' }
                                            const newDefaultSorting = defaultSorting.filter((s: { id: string; desc: boolean }) => s.id !== columnId)
                                            newDefaultSorting.push(newSort)
                                            const newSorting = sorting.filter((s: { id: string; desc: boolean }) => s.id !== columnId)
                                            newSorting.push(newSort)
                                            setSorting(newSorting)
                                          }
                                        }}
                                      >
                                        <DropdownMenuRadioItem value="none">
                                          <IconArrowsSort className="h-4 w-4 mr-2" />
                                          {t.none}
                                        </DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="asc">
                                          <IconArrowUp className="h-4 w-4 mr-2" />
                                          {t.asc}
                                        </DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="desc">
                                          <IconArrowDown className="h-4 w-4 mr-2" />
                                          {t.desc}
                                        </DropdownMenuRadioItem>
                                      </DropdownMenuRadioGroup>
                                    </>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuLabel>{t.width || "Width"}</DropdownMenuLabel>
                                  <div className="px-2 py-1.5">
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        min="50"
                                        max="1000"
                                        value={columnSizing?.[columnId] || ''}
                                        onChange={(e) => {
                                          const value = e.target.value ? parseInt(e.target.value, 10) : undefined
                                          if (value && value >= 50) {
                                            setColumnSizing(prev => ({ ...prev, [columnId]: value }))
                                          } else if (!value) {
                                            setColumnSizing(prev => {
                                              const next = { ...prev }
                                              delete next[columnId]
                                              return next
                                            })
                                          }
                                        }}
                                        placeholder={t.widthAuto || "Auto"}
                                        className="h-8 text-xs"
                                      />
                                      {columnSizing?.[columnId] && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                          onClick={() => {
                                            setColumnSizing(prev => {
                                              const next = { ...prev }
                                              delete next[columnId]
                                              return next
                                            })
                                          }}
                                          title={t.widthReset || "Reset"}
                                        >
                                          <IconX className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuLabel>{t.alignment}</DropdownMenuLabel>
                                  <DropdownMenuRadioGroup
                                    value={columnAlignment?.[columnId] || 'left'}
                                    onValueChange={(value) => {
                                      setColumnAlignment(prev => ({
                                        ...prev,
                                        [columnId]: value as 'left' | 'center' | 'right'
                                      }))
                                    }}
                                  >
                                    <DropdownMenuRadioItem value="left">
                                      <IconAlignLeft className="h-4 w-4 mr-2" />
                                      {t.left}
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="center">
                                      <IconAlignCenter className="h-4 w-4 mr-2" />
                                      {t.center}
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="right">
                                      <IconAlignRight className="h-4 w-4 mr-2" />
                                      {t.right}
                                    </DropdownMenuRadioItem>
                                  </DropdownMenuRadioGroup>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                            </SortableColumnItem>
                          )
                        } else {
                          // Schema column
                          const columnSchema = schema.find((col) => col.name === columnId)
                          let columnTitle = columnSchema?.title || columnId
                          if (translations && state.collection) {
                            const dataTableFieldTitle = (translations as any)?.dataTable?.fields?.[state.collection]?.[columnId] as string | undefined
                            if (dataTableFieldTitle) {
                              columnTitle = dataTableFieldTitle
                            } else {
                              const directFieldTitle = (translations as any)?.fields?.[state.collection]?.[columnId] as string | undefined
                              if (directFieldTitle) {
                                columnTitle = directFieldTitle
                              }
                            }
                          }
                          const canSort = column?.getCanSort() ?? false
                          const defaultSortForColumn = defaultSorting.find(s => s.id === columnId)
                          const sortValue = defaultSortForColumn ? (defaultSortForColumn.desc ? 'desc' : 'asc') : 'none'
                          
                          return (
                            <SortableColumnItem key={columnId} id={columnId}>
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="flex-1">
                                  <div className="flex items-center justify-between w-full">
                                    <span>{columnTitle}</span>
                                    <div className="flex items-center gap-1 ml-2">
                                      {column?.getIsVisible() && (
                                        <IconCheck className="h-3 w-3" />
                                      )}
                                      {defaultSortForColumn && (
                                        defaultSortForColumn.desc ? (
                                          <IconArrowDown className="h-3 w-3 opacity-50" />
                                        ) : (
                                          <IconArrowUp className="h-3 w-3 opacity-50" />
                                        )
                                      )}
                                    </div>
                                  </div>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  <DropdownMenuCheckboxItem
                                    checked={column?.getIsVisible() ?? false}
                                    onCheckedChange={(value) =>
                                      column?.toggleVisibility(!!value)
                                    }
                                  >
                                    {t.showColumn}
                                  </DropdownMenuCheckboxItem>
                                  {canSort && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuLabel>{t.defaultSorting}</DropdownMenuLabel>
                                      <DropdownMenuRadioGroup
                                        value={sortValue}
                                        onValueChange={(value) => {
                                          if (value === 'none') {
                                            if (sorting.find((s: { id: string; desc: boolean }) => s.id === columnId)) {
                                              const newSorting = sorting.filter((s: { id: string; desc: boolean }) => s.id !== columnId)
                                              setSorting(newSorting)
                                            }
                                          } else {
                                            const newSort = { id: columnId, desc: value === 'desc' }
                                            const newDefaultSorting = defaultSorting.filter((s: { id: string; desc: boolean }) => s.id !== columnId)
                                            newDefaultSorting.push(newSort)
                                            const newSorting = sorting.filter((s: { id: string; desc: boolean }) => s.id !== columnId)
                                            newSorting.push(newSort)
                                            setSorting(newSorting)
                                          }
                                        }}
                                      >
                                        <DropdownMenuRadioItem value="none">
                                          <IconArrowsSort className="h-4 w-4 mr-2" />
                                          {t.none}
                                        </DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="asc">
                                          <IconArrowUp className="h-4 w-4 mr-2" />
                                          {t.asc}
                                        </DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="desc">
                                          <IconArrowDown className="h-4 w-4 mr-2" />
                                          {t.desc}
                                        </DropdownMenuRadioItem>
                                      </DropdownMenuRadioGroup>
                                    </>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuLabel>{t.width || "Width"}</DropdownMenuLabel>
                                  <div className="px-2 py-1.5">
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        min="50"
                                        max="1000"
                                        value={columnSizing?.[columnId] || ''}
                                        onChange={(e) => {
                                          const value = e.target.value ? parseInt(e.target.value, 10) : undefined
                                          if (value && value >= 50) {
                                            setColumnSizing(prev => ({ ...prev, [columnId]: value }))
                                          } else if (!value) {
                                            setColumnSizing(prev => {
                                              const next = { ...prev }
                                              delete next[columnId]
                                              return next
                                            })
                                          }
                                        }}
                                        placeholder={t.widthAuto || "Auto"}
                                        className="h-8 text-xs"
                                      />
                                      {columnSizing?.[columnId] && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                          onClick={() => {
                                            setColumnSizing(prev => {
                                              const next = { ...prev }
                                              delete next[columnId]
                                              return next
                                            })
                                          }}
                                          title={t.widthReset || "Reset"}
                                        >
                                          <IconX className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuLabel>{t.alignment}</DropdownMenuLabel>
                                  <DropdownMenuRadioGroup
                                    value={columnAlignment?.[columnId] || 'left'}
                                    onValueChange={(value) => {
                                      setColumnAlignment(prev => ({
                                        ...prev,
                                        [columnId]: value as 'left' | 'center' | 'right'
                                      }))
                                    }}
                                  >
                                    <DropdownMenuRadioItem value="left">
                                      <IconAlignLeft className="h-4 w-4 mr-2" />
                                      {t.left}
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="center">
                                      <IconAlignCenter className="h-4 w-4 mr-2" />
                                      {t.center}
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="right">
                                      <IconAlignRight className="h-4 w-4 mr-2" />
                                      {t.right}
                                    </DropdownMenuRadioItem>
                                  </DropdownMenuRadioGroup>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                            </SortableColumnItem>
                          )
                        }
                      })}
                    </SortableContext>
                  </DndContext>
                )
              })()}
              {/* Page size setting */}
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <div className="flex items-center justify-between w-full">
                    <span>{t.rowsPerPage}</span>
                    <span className="text-muted-foreground text-sm ml-2">{defaultPageSize}</span>
                  </div>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent sideOffset={4}>
                  <DropdownMenuLabel>{t.rowsPerPage}</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={String(defaultPageSize)}
                    onValueChange={(value) => {
                      const pageSize = Number(value)
                      if (!isNaN(pageSize) && pageSize > 0) {
                        setDefaultPageSize(pageSize)
                        setPagination(prev => ({ ...prev, pageSize }))
                        setState(prev => ({ ...prev, pageSize }))
                      }
                    }}
                  >
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <DropdownMenuRadioItem
                        key={pageSize}
                        value={String(pageSize)}
                      >
                        {pageSize}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              {/* Filter settings submenu */}
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <div className="flex items-center">
                    <IconFilter className="h-4 w-4 mr-2" />
                    <span>{t.filters || "Кнопки-фильтры"}</span>
                  </div>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuCheckboxItem
                    checked={filterSettings.dateFilter}
                    onCheckedChange={(checked) => {
                      setFilterSettings(prev => ({ ...prev, dateFilter: checked }))
                    }}
                  >
                    <div className="flex items-center">
                      <IconCalendar className="h-4 w-4 mr-2" />
                      <span>{t.dateFilter?.filter || "По дате"}</span>
                    </div>
                  </DropdownMenuCheckboxItem>
                  {state.collection === 'contractors' && (
                    <>
                      <DropdownMenuCheckboxItem
                        checked={filterSettings.statusFilter}
                        onCheckedChange={(checked) => {
                          setFilterSettings(prev => ({ ...prev, statusFilter: checked }))
                        }}
                      >
                        <div className="flex items-center">
                          <IconTag className="h-4 w-4 mr-2" />
                          <span>{t.statusFilter?.filter || "По статусу"}</span>
                        </div>
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={filterSettings.cityFilter}
                        onCheckedChange={(checked) => {
                          setFilterSettings(prev => ({ ...prev, cityFilter: checked }))
                        }}
                      >
                        <div className="flex items-center">
                          <IconMapPin className="h-4 w-4 mr-2" />
                          <span>{t.cityFilter?.filter || "По городу"}</span>
                        </div>
                      </DropdownMenuCheckboxItem>
                    </>
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              {/* Edit mode */}
              <DropdownMenuSeparator />
              <div className="flex items-center justify-between gap-4 px-2 py-1.5">
                <div className="flex items-center">
                  <IconEdit className="h-4 w-4 mr-2" />
                  <Label htmlFor="edit-mode-switch" className="text-sm font-medium cursor-pointer">
                    {t.editMode || "Edit Mode"}
                  </Label>
                </div>
                <Switch
                  id="edit-mode-switch"
                  checked={editMode}
                  onCheckedChange={(checked) => {
                    setEditMode(checked)
                    if (typeof window !== 'undefined' && state.collection) {
                      try {
                        localStorage.setItem(`edit-mode-${state.collection}`, JSON.stringify(checked))
                      } catch (e) {
                        // Ignore
                      }
                    }
                  }}
                />
              </div>
              {/* Card view mode */}
              <DropdownMenuSeparator />
              {isMobile && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <IconLayoutGrid className="h-4 w-4 mr-2" />
                        <span>{t.cardView || "Card View"}</span>
                      </div>
                      {cardViewModeMobile && (
                        <IconCheck className="h-4 w-4" />
                      )}
                    </div>
                  </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <div className="flex items-center justify-between gap-4 px-2 py-1.5">
                    <Label htmlFor="card-view-mobile-switch" className="text-sm font-medium cursor-pointer">
                      {t.cardView || "Card View"}
                    </Label>
                    <Switch
                      id="card-view-mobile-switch"
                      checked={cardViewModeMobile}
                      onCheckedChange={setCardViewModeMobile}
                    />
                  </div>
                </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              {!isMobile && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <IconLayoutGrid className="h-4 w-4 mr-2" />
                        <span>{t.cardView || "Card View"}</span>
                      </div>
                      {cardViewModeDesktop && (
                        <IconCheck className="h-4 w-4" />
                      )}
                    </div>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <div className="flex items-center justify-between gap-4 px-2 py-1.5">
                      <Label htmlFor="card-view-desktop-switch" className="text-sm font-medium cursor-pointer">
                        {t.cardView || "Card View"}
                      </Label>
                      <Switch
                        id="card-view-desktop-switch"
                        checked={cardViewModeDesktop}
                        onCheckedChange={setCardViewModeDesktop}
                      />
                    </div>
                    {cardViewModeDesktop && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>{t.cardsPerRow || "Cards per row"}</DropdownMenuLabel>
                        <DropdownMenuRadioGroup
                          value={String(cardsPerRow)}
                          onValueChange={(value) => {
                            const numValue = parseInt(value, 10)
                            if (numValue >= 1 && numValue <= 6) {
                              setCardsPerRow(numValue)
                            }
                          }}
                        >
                          {[1, 2, 3, 4, 5, 6].map((num) => (
                            <DropdownMenuRadioItem key={num} value={String(num)}>
                              {num}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              {/* Show/hide filter row */}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  setShowFilterRow(!showFilterRow)
                }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <IconFilter className="h-4 w-4 mr-2" />
                  {t.showFilters}
                </div>
                {showFilterRow && (
                  <IconCheck className="h-4 w-4" />
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" className="bg-primary-foreground h-9" onClick={() => setCreateOpen(true)}>
            <IconPlus />
            <span className="hidden lg:inline">{t.add}</span>
          </Button>
        </div>
      </div>
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-0"
      >
        {loading && (
          <div className="flex items-center justify-center py-4">
            <IconLoader className="size-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              {t.loading ? t.loading.replace("{collection}", collectionLabel) : `Loading ${collectionLabel}...`}
            </span>
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-1 text-sm text-destructive">
            Error: {error}
          </div>
        )}
        {!loading && !error && (
          <>
        {(isMobile ? cardViewModeMobile : cardViewModeDesktop) ? (
          // Card View
          <div 
            className={cn(
              "grid gap-4",
              isMobile ? "grid-cols-1" : ""
            )}
            style={!isMobile ? { gridTemplateColumns: `repeat(${cardsPerRow}, minmax(0, 1fr))` } : undefined}
          >
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const allVisibleCells = row.getVisibleCells().filter(cell => 
                  cell.column.id !== 'select' && cell.column.id !== 'actions'
                )
                // Separate title cell for header - prioritize title, fallback to name only if title is not available
                const titleCell = allVisibleCells.find(cell => cell.column.id === 'title')
                const nameCell = allVisibleCells.find(cell => cell.column.id === 'name')
                // Use title if available, otherwise don't use name (user wants title, not name)
                const headerCell = titleCell || null
                // Filter out title from body cells (title goes to header), but keep name in body
                const visibleCells = allVisibleCells.filter(cell => 
                  cell.column.id !== 'title'
                )
                const actionsCell = row.getVisibleCells().find(cell => cell.column.id === 'actions')
                const selectCell = row.getVisibleCells().find(cell => cell.column.id === 'select')
                
                return (
                  <div
                    key={row.id}
                    className="rounded-lg border bg-primary-foreground p-3 space-y-2"
                    onDoubleClick={() => onEditRequest(row)}
                  >
                    {/* Header with checkbox, title and actions */}
                    <div className="flex items-center justify-between pb-2 border-b gap-2">
                      {selectCell && (
                        <div className="flex items-center">
                          {flexRender(selectCell.column.columnDef.cell, selectCell.getContext())}
                        </div>
                      )}
                      {headerCell && (() => {
                        // For card header, if title is JSON field with title/value structure, use title
                        const rowData = row.original
                        const titleValue = rowData?.title
                        let displayTitle: React.ReactNode = null
                        
                        if (titleValue && typeof titleValue === 'string') {
                          try {
                            const parsed = JSON.parse(titleValue)
                            if (parsed && typeof parsed === 'object') {
                              const localeValue = parsed[locale] || parsed.en || parsed.ru || parsed.rs || null
                              if (localeValue && typeof localeValue === 'object' && 'title' in localeValue) {
                                // Use title for card header
                                displayTitle = localeValue.title != null ? String(localeValue.title) : null
                              }
                            }
                          } catch (e) {
                            // Not JSON, use as is
                          }
                        }
                        
                        // If we didn't extract title from JSON, use normal cell render
                        if (displayTitle === null) {
                          displayTitle = flexRender(headerCell.column.columnDef.cell, headerCell.getContext())
                        }
                        
                        return (
                          <div className="flex-1 font-semibold text-base truncate">
                            {displayTitle}
                          </div>
                        )
                      })()}
                      {actionsCell && (
                        <div className="ml-auto">
                          {flexRender(actionsCell.column.columnDef.cell, actionsCell.getContext())}
                        </div>
                      )}
                    </div>
                    {/* Card content - fields on left, values on right */}
                    <div className="space-y-2">
                      {visibleCells.map((cell) => {
                        // Extract baseKey for data_in fields
                        const isDataInField = cell.column.id.startsWith('data_in.')
                        const baseKey = isDataInField ? cell.column.id.replace('data_in.', '') : null
                        
                        const columnSchema = schema.find((col) => {
                          if (isDataInField) {
                            return false
                          }
                          return col.name === cell.column.id
                        })
                        
                        // For data_in fields, use unified function to get label
                        let fieldLabel: string
                        if (isDataInField && baseKey) {
                          // Use unified function to get field label
                          const rowData = row.original
                          const dataInLabel = getDataInFieldLabel(baseKey, rowData, locale, translations, state.collection)
                          // Use label from function, or fallback to baseKey only if absolutely necessary
                          fieldLabel = dataInLabel || baseKey
                        } else {
                          // For regular fields
                          const columnTitle = columnSchema?.title || cell.column.id
                          const dataTableFieldTitle = (translations as any)?.dataTable?.fields?.[state.collection]?.[cell.column.id]
                          fieldLabel = dataTableFieldTitle || columnTitle
                        }
                        
                        return (
                          <div key={cell.id} className="flex items-center gap-2 text-sm">
                            <div className="font-medium text-muted-foreground min-w-[120px] shrink-0 text-left">
                              {fieldLabel}:
                            </div>
                            <div className="flex-1 text-left">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="rounded-lg border bg-primary-foreground p-6 text-center text-muted-foreground">
                {t.noDataFound.replace("{collection}", collectionLabel)}
              </div>
            )}
          </div>
        ) : (
          // Table View
        <div className="overflow-x-auto rounded-lg border bg-primary-foreground">
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const canResize = header.column.getCanResize()
                      const isResizing = header.column.getIsResizing()
                      return (
                        <TableHead 
                          key={header.id} 
                          colSpan={header.colSpan} 
                          className={header.column.id === 'actions' ? 'p-0 pr-0 lg:static sticky left-0 top-0 z-20 bg-muted' : header.column.id === 'select' ? 'p-0 pl-0' : ''}
                          style={{ 
                            width: header.getSize(), 
                            position: header.column.id === 'actions' ? 'sticky' : 'relative',
                            left: header.column.id === 'actions' ? 0 : undefined
                          }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                          {canResize && (
                            <div
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                              className={`absolute top-0 right-0 h-full w-1 cursor-col-resize select-none touch-none ${
                                isResizing ? 'bg-primary' : 'bg-transparent hover:bg-primary/50'
                              }`}
                              style={{ userSelect: 'none' }}
                            />
                          )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              {/* Filter row - show filter inputs under headers */}
              {filterSettings.columnFilters && showFilterRow && table.getHeaderGroups().length > 0 && (
                <thead className="bg-muted/50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={`filter-${headerGroup.id}`}>
                      {headerGroup.headers.map((header) => {
                        const columnId = header.column.id
                        
                        // Skip filter for row selection and actions columns
                        if (columnId === 'select' || columnId === 'actions') {
                          return (
                            <TableHead key={`filter-${header.id}`} className="p-0">
                              {header.isPlaceholder ? null : <div />}
                            </TableHead>
                          )
                        }
                        
                        // Find column schema to determine filter type
                        const colSchema = schema.find((col) => {
                          if (columnId.startsWith('data_in.')) {
                            return false // data_in columns handled separately
                          }
                          return col.name === columnId
                        })
                        
                        // Check if this column has a relation (for RelationSelect)
                        const hasRelation = colSchema && (colSchema as any).relation
                        
                        // Determine if this is a multiselect field
                        const isMultiselect = colSchema && !hasRelation && (
                          (colSchema.fieldType === 'select' && colSchema.selectOptions) ||
                          (colSchema.fieldType === 'enum' && colSchema.enum) ||
                          colSchema.fieldType === 'array' ||
                          (colSchema as any).multiple === true
                        )
                        
                        // Get options for multiselect
                        let multiselectOptions: Array<{ value: string; label: string }> = []
                        if (isMultiselect) {
                          if (colSchema.fieldType === 'select' && colSchema.selectOptions) {
                            multiselectOptions = colSchema.selectOptions
                          } else if (colSchema.fieldType === 'enum' && colSchema.enum) {
                            multiselectOptions = colSchema.enum.values.map((val, idx) => ({
                              value: val,
                              label: colSchema.enum!.labels[idx] || val
                            }))
                          }
                        }
                        
                        // Get current filter value (array for multiselect, string for text/relation)
                        const currentFilterValue = columnFilterValues[columnId]
                        const multiselectValue = isMultiselect 
                          ? (Array.isArray(currentFilterValue) ? currentFilterValue : [])
                          : []
                        const textValue = !isMultiselect && !hasRelation
                          ? (typeof currentFilterValue === 'string' ? currentFilterValue : '')
                          : ''
                        const relationValue = hasRelation
                          ? (currentFilterValue || null)
                          : null
                        
                        return (
                          <TableHead key={`filter-${header.id}`} className="p-1">
                            {header.isPlaceholder ? null : (
                              <div className="flex items-center justify-center w-full">
                                {hasRelation ? (
                                  <div className="relative w-full">
                                    <RelationMultiselect
                                      relation={(colSchema as any).relation}
                                      value={relationValue}
                                      onChange={(value) => {
                                        setColumnFilterValues(prev => ({
                                          ...prev,
                                          [columnId]: value || ''
                                        }))
                                        if (value && value.length > 0) {
                                          setColumnFilters(prev => {
                                            const existing = prev.find(f => f.id === columnId)
                                            if (existing) {
                                              return prev.map(f => 
                                                f.id === columnId ? { ...f, value } : f
                                              )
                                            }
                                            return [...prev, { id: columnId, value }]
                                          })
                                        } else {
                                          setColumnFilters(prev => prev.filter(f => f.id !== columnId))
                                        }
                                      }}
                                      translations={translations}
                                      locale={locale}
                                    />
                                    {relationValue && (Array.isArray(relationValue) ? relationValue.length > 0 : true) && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          // Clear filter - same logic as onChange(null)
                                          setColumnFilterValues(prev => ({
                                            ...prev,
                                            [columnId]: ''
                                          }))
                                          setColumnFilters(prev => prev.filter(f => f.id !== columnId))
                                        }}
                                        title={t?.form?.clear || "Clear"}
                                      >
                                        <IconX className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                ) : isMultiselect && multiselectOptions.length > 0 ? (
                                  <div className="relative w-full">
                                    <ColumnFilterMultiselect
                                      options={multiselectOptions}
                                      value={multiselectValue}
                                      translations={translations}
                                      onValueChange={(values) => {
                                        setColumnFilterValues(prev => ({
                                          ...prev,
                                          [columnId]: values
                                        }))
                                        // Update columnFilters state
                                        if (values.length > 0) {
                                          setColumnFilters(prev => {
                                            const existing = prev.find(f => f.id === columnId)
                                            if (existing) {
                                              return prev.map(f => 
                                                f.id === columnId 
                                                  ? { ...f, value: values }
                                                  : f
                                              )
                                            }
                                            return [...prev, { id: columnId, value: values }]
                                          })
                                        } else {
                                          setColumnFilters(prev => prev.filter(f => f.id !== columnId))
                                        }
                                      }}
                                      placeholder={(translations as any)?.dataTable?.filterPlaceholder || "Filter..."}
                                    />
                                    {multiselectValue.length > 0 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          // Clear filter - same logic as onValueChange([])
                                          setColumnFilterValues(prev => ({
                                            ...prev,
                                            [columnId]: []
                                          }))
                                          setColumnFilters(prev => prev.filter(f => f.id !== columnId))
                                        }}
                                        title={t?.form?.clear || "Clear"}
                                      >
                                        <IconX className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="relative w-full">
                                    <Input
                                      placeholder={(translations as any)?.dataTable?.filterPlaceholder || "Filter..."}
                                      value={textValue}
                                      onChange={(e) => {
                                        const value = e.target.value
                                        setColumnFilterValues(prev => ({
                                          ...prev,
                                          [columnId]: value
                                        }))
                                        // Update columnFilters state
                                        if (value) {
                                          setColumnFilters(prev => {
                                            const existing = prev.find(f => f.id === columnId)
                                            if (existing) {
                                              return prev.map(f => 
                                                f.id === columnId 
                                                  ? { ...f, value }
                                                  : f
                                              )
                                            }
                                            return [...prev, { id: columnId, value }]
                                          })
                                        } else {
                                          setColumnFilters(prev => prev.filter(f => f.id !== columnId))
                                        }
                                      }}
                                      className="h-7 text-xs flex-1 pr-7"
                                      size={1}
                                    />
                                    {textValue && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          setColumnFilterValues(prev => ({
                                            ...prev,
                                            [columnId]: ''
                                          }))
                                          setColumnFilters(prev => prev.filter(f => f.id !== columnId))
                                        }}
                                        title={t?.form?.clear || "Clear"}
                                      >
                                        <IconX className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  ))}
                </thead>
              )}
                <TableBody>
                {schema.length > 0 && reorderedColumns.length > 0 && !loading && table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => {
                      // Safely get row ID
                      const rowId = row.id || String(row.original[primaryKey] ?? Math.random())
                      return (
                        <TableRow
                          key={rowId}
                          data-state={row.getIsSelected() && "selected"}
                          onDoubleClick={() => onEditRequest(row)}
                          className="cursor-pointer bg-primary-foreground"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell 
                              key={cell.id} 
                              className={cell.column.id === 'actions' ? 'p-0 pr-0 lg:static sticky left-0 z-10 bg-primary-foreground h-full' : cell.column.id === 'select' ? 'p-0 pl-0' : ''}
                              style={{ 
                                width: cell.column.getSize(), 
                                position: cell.column.id === 'actions' ? 'sticky' : undefined,
                                left: cell.column.id === 'actions' ? 0 : undefined
                              }}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      )
                    })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                        {t.noDataFound.replace("{collection}", collectionLabel)}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        </div>
        )}
        <div className="flex items-center justify-between px-0">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                {t.selectedRecords.replace('{count}', String(table.getFilteredSelectedRowModel().rows.length)).replace('{total}', String(total))}
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                {t.rowsPerPage}
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  const pageSize = Number(value)
                  table.setPageSize(pageSize)
                  // Also update default page size
                  setDefaultPageSize(pageSize)
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
                  {t.page.replace('{page}', String(state.page)).replace('{total}', String(totalPages || 1))}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                    disabled={state.page === 1}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                    disabled={state.page === 1}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                    disabled={state.page >= totalPages}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                    onClick={() => table.setPageIndex(totalPages - 1)}
                    disabled={state.page >= totalPages}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
          </>
        )}
      </TabsContent>

      <ResponsiveDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <ResponsiveDialogContent className="p-6">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{t.delete?.deleteRecord?.title || "Delete record?"}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {(t.delete?.deleteRecord?.description || "This action cannot be undone. You are about to delete one record from \"{collection}\".").replace("{collection}", collectionLabel)}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>{t.form?.cancel || "Cancel"}</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>{t.delete?.delete || "Delete"}</Button>
          </ResponsiveDialogFooter>
          <ResponsiveDialogClose className="sr-only" />
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ResponsiveDialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
        <ResponsiveDialogContent className="p-6">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{t.delete?.deleteSelected?.title || "Delete selected records?"}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {(t.delete?.deleteSelected?.description || "This action cannot be undone. You are about to delete {count} records from \"{collection}\".").replace("{count}", String(table.getFilteredSelectedRowModel().rows.length)).replace("{collection}", collectionLabel)}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <Button variant="outline" onClick={() => setBatchDeleteOpen(false)} disabled={batchDeleting}>{t.form?.cancel || "Cancel"}</Button>
            <Button variant="destructive" onClick={handleBatchDelete} disabled={batchDeleting}>
              {batchDeleting ? (
                <>
                  <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                  {t.delete?.deleteSelected?.deleting || "Deleting..."}
                </>
              ) : (
                t.delete?.deleteSelected?.deleteAll || 'Delete All'
              )}
            </Button>
          </ResponsiveDialogFooter>
          <ResponsiveDialogClose className="sr-only" />
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={createOpen}
        onOpenChange={(open) => {
        setCreateOpen(open)
        if (!open) {
          // Clear form data and price inputs when dialog closes
          setFormData({})
          setCreateError(null)
          setCreateFormTab("main")
          setCreateDataInLanguage(locale)
          setCreateDataInEntries([])
          setCreateDataInRaw("{}")
          setCreateDataInRawError(null)
          setPriceInputs(prev => {
            const newInputs = { ...prev }
            editableFields.forEach(field => {
              if (field.fieldType === 'price') {
                delete newInputs[`create-${field.name}`]
              }
            })
            return newInputs
          })
        }
      }}
        onlyDrawer
        direction="right"
        handleOnly
      >
        <ResponsiveDialogContent className="h-[calc(100svh-16px)] w-[560px] max-w-[95vw] overflow-hidden p-0">
          <div className="flex h-full flex-col">
            <div className="border-b px-6 py-4">
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>{t.addRecord.title.replace("{collection}", collectionLabel)}</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>
                  {t.addRecord.description}
                </ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
            </div>
            <form onSubmit={handleCreateSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                <Tabs value={createFormTab} onValueChange={(v) => setCreateFormTab(v as any)} className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="main">{t.tabs?.main || "Main"}</TabsTrigger>
                    {(state.collection === 'roles' || state.collection === 'contractors') && <TabsTrigger value="info">{t.tabs?.info || "Info"}</TabsTrigger>}
                    <TabsTrigger value="details">{t.tabs?.details || "Details"}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="main" className="mt-0">
                    <div className="grid gap-4">
                      {editableFields.filter((f) => {
                        // Debug log for contractors relation fields in create form
                        if (state.collection === 'contractors' && (f.name === 'status_name' || f.name === 'city_name')) {
                          console.log(`[DataTable Create Form] Field ${f.name}:`, {
                            isAutoGenerated: isAutoGeneratedField(f.name, !!f.relation),
                            hasRelation: !!f.relation,
                            relation: f.relation,
                            isPrimary: f.primary,
                            isHidden: f.hidden,
                            inEditableFields: true,
                            inList: ['title', 'reg', 'tin', 'status_name', 'city_name', 'order', 'media_id'].includes(f.name),
                          })
                        }
                        
                        if (f.name === "data_in") return false
                        if (state.collection === 'roles') {
                          // For roles, show: title, name, description, is_system, order, xaid
                          return ['title', 'name', 'description', 'is_system', 'order', 'xaid'].includes(f.name)
                        }
                        if (state.collection === 'contractors') {
                          // For contractors, show: title, reg, tin, status_name, city_name, order, media_id
                          // Hide xaid (auto-generated from expanse selector)
                          if (f.name === 'xaid') return false
                          return ['title', 'reg', 'tin', 'status_name', 'city_name', 'order', 'media_id'].includes(f.name)
                        }
                        if (state.collection === 'expanses' && f.name === 'xaid') {
                          // Hide xaid in expanses form (auto-generated)
                          return false
                        }
                        return true
                      }).map((field) => (
                    <div key={field.name} className="flex flex-col gap-2">
                {field.fieldType === 'boolean' ? (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`field-${field.name}`}
                      checked={formData[field.name] === true}
                      onCheckedChange={(checked) => handleFieldChange(field.name, checked === true)}
                    />
                    <Label htmlFor={`field-${field.name}`} className="text-sm font-medium cursor-pointer">
                      {(translations as any)?.dataTable?.fields?.[state.collection]?.[field.name] || field.title || field.name}
                    </Label>
                  </div>
                ) : field.fieldType === 'date' || field.fieldType === 'time' || field.fieldType === 'datetime' ? (
                  <>
                    <Label htmlFor={`field-${field.name}`} className="text-sm font-medium">
                      {(translations as any)?.dataTable?.fields?.[state.collection]?.[field.name] || field.title || field.name}
                      {!field.nullable && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <DateTimePicker
                      mode={field.fieldType}
                      value={formData[field.name] || null}
                      onChange={(date) => handleFieldChange(field.name, date)}
                      placeholder={t.form?.select?.replace('{field}', field.title || field.name) || `Select ${field.title || field.name}`}
                    />
                  </>
                ) : field.fieldType === 'phone' ? (
                  <>
                    <Label htmlFor={`field-${field.name}`} className="text-sm font-medium">
                      {(translations as any)?.dataTable?.fields?.[state.collection]?.[field.name] || field.title || field.name}
                      {!field.nullable && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <PhoneInput
                      value={formData[field.name] || ''}
                      onChange={(value) => handleFieldChange(field.name, value || '')}
                      placeholder={t.form?.enter?.replace('{field}', field.title || field.name) || `Enter ${field.title || field.name}`}
                    />
                  </>
                ) : field.fieldType === 'password' ? (
                  <>
                    <Label htmlFor={`field-${field.name}`} className="text-sm font-medium">
                      {(translations as any)?.dataTable?.fields?.[state.collection]?.[field.name] || field.title || field.name}
                      {!field.nullable && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Input
                      id={`field-${field.name}`}
                      type="password"
                      required={!field.nullable}
                      value={formData[field.name] || ""}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder={t.form?.enter?.replace('{field}', field.title || field.name) || `Enter ${field.title || field.name}`}
                      minLength={8}
                    />
                    <Label htmlFor={`field-${field.name}-confirm`} className="text-sm font-medium">
                      {t.form?.confirm?.replace('{field}', field.title || field.name) || `Confirm ${field.title || field.name}`}
                      {!field.nullable && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Input
                      id={`field-${field.name}-confirm`}
                      type="password"
                      required={!field.nullable}
                      value={formData[`${field.name}_confirm`] || ""}
                      onChange={(e) => handleFieldChange(`${field.name}_confirm`, e.target.value)}
                      placeholder={t.form?.confirm?.replace('{field}', field.title || field.name) || `Confirm ${field.title || field.name}`}
                      minLength={8}
                    />
                    {formData[field.name] && formData[`${field.name}_confirm`] && formData[field.name] !== formData[`${field.name}_confirm`] && (
                      <p className="text-sm text-destructive">{t.form?.passwordsDoNotMatch || "Passwords do not match"}</p>
                    )}
                  </>
                ) : field.fieldType === 'json' && getI18nJsonFieldsForCollection(state.collection).includes(field.name) ? (
                  <>
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`field-${field.name}`} className="text-sm font-medium">
                        {(translations as any)?.dataTable?.fields?.[state.collection]?.[field.name] || field.title || field.name}
                        {!field.nullable && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      <Tabs
                        value={jsonFieldLanguage[field.name] || locale}
                        onValueChange={(value) => setJsonFieldLanguage((prev) => ({ ...prev, [field.name]: value as LanguageCode }))}
                        className="w-auto"
                      >
                        <TabsList className="h-8">
                          {LANGUAGES.filter((l) => enabledLanguageCodes.includes(l.code)).map((l) => (
                            <TabsTrigger key={l.code} value={l.code} className="text-xs px-2 py-1">
                              {l.shortName}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </Tabs>
                    </div>
                    <Tabs
                      value={jsonFieldLanguage[field.name] || locale}
                      onValueChange={(value) => setJsonFieldLanguage((prev) => ({ ...prev, [field.name]: value as LanguageCode }))}
                      className="w-full"
                    >
                      {LANGUAGES.filter((l) => enabledLanguageCodes.includes(l.code)).map((l) => (
                        <TabsContent key={l.code} value={l.code} className="mt-0">
                          <Input
                            id={`field-${field.name}_${l.code}`}
                            type="text"
                            required={!field.nullable}
                            value={formData[`${field.name}_${l.code}`] || ""}
                            onChange={(e) => handleFieldChange(`${field.name}_${l.code}`, e.target.value)}
                            placeholder={
                              t.form?.enter?.replace('{field}', `${field.title || field.name} (${l.name})`) ||
                              `Enter ${field.title || field.name} (${l.name})`
                            }
                          />
                        </TabsContent>
                      ))}
                    </Tabs>
                  </>
                ) : (field as any).fieldType === 'price' ? (
                  <>
                    <Label htmlFor={`field-${field.name}`} className="text-sm font-medium">
                      {(translations as any)?.dataTable?.fields?.[state.collection]?.[field.name] || field.title || field.name}
                      {!field.nullable && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Input
                      id={`field-${field.name}`}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      required={!field.nullable}
                      value={
                        priceInputs[`create-${field.name}`] !== undefined
                          ? priceInputs[`create-${field.name}`]
                          : formData[field.name] === undefined || formData[field.name] === null
                            ? ""
                            : (Number(formData[field.name]) / 100).toFixed(2)
                      }
                      onChange={(e) => {
                        let v = e.target.value.replace(/,/g, '.')
                        setPriceInputs((prev) => ({ ...prev, [`create-${field.name}`]: v }))
                        if (v.includes('.')) {
                          const [i, d] = v.split('.')
                          v = `${i}.${d.slice(0, 2)}`
                        }
                        const num = v === '' ? NaN : Number(v)
                        const cents = !isFinite(num) ? null : Math.round(num * 100)
                        handleFieldChange(field.name, cents)
                      }}
                      onBlur={(e) => {
                        let v = e.target.value.replace(/,/g, '.')
                        if (v.includes('.')) {
                          const [i, d] = v.split('.')
                          v = `${i}.${d.slice(0, 2)}`
                        }
                        const num = v === '' ? NaN : Number(v)
                        if (isFinite(num)) {
                          const formatted = num.toFixed(2)
                          setPriceInputs((prev) => ({ ...prev, [`create-${field.name}`]: formatted }))
                          const cents = Math.round(num * 100)
                          handleFieldChange(field.name, cents)
                        }
                      }}
                      placeholder={`Enter ${field.title || field.name}`}
                    />
                  </>
                ) : field.relation && typeof field.relation === 'object' && field.relation.collection ? (
                  <>
                    <Label htmlFor={`field-${field.name}`} className="text-sm font-medium">
                      {(translations as any)?.dataTable?.fields?.[state.collection]?.[field.name] || field.title || field.name}
                      {!field.nullable && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <RelationSelect
                      relation={field.relation}
                      value={formData[field.name]}
                      onChange={(value) => handleFieldChange(field.name, value)}
                      disabled={false}
                      required={!field.nullable}
                      translations={t}
                      search={state.search}
                      locale={locale}
                    />
                  </>
                ) : field.fieldType === 'select' && field.selectOptions ? (
                  <>
                    <Label htmlFor={`field-${field.name}`} className="text-sm font-medium">
                      {(translations as any)?.dataTable?.fields?.[state.collection]?.[field.name] || field.title || field.name}
                      {!field.nullable && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <ComboboxSelect
                      id={`field-${field.name}`}
                      options={field.selectOptions}
                      value={formData[field.name] || ""}
                      onValueChange={(value) => handleFieldChange(field.name, value)}
                      placeholder={t.form?.select?.replace('{field}', field.title || field.name) || `Select ${field.title || field.name}`}
                      disabled={false}
                      required={!field.nullable}
                      translations={t}
                    />
                  </>
                ) : field.fieldType === 'enum' && field.enum ? (
                  <>
                    <Label htmlFor={`field-${field.name}`} className="text-sm font-medium">
                      {(translations as any)?.dataTable?.fields?.[state.collection]?.[field.name] || field.title || field.name}
                      {!field.nullable && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Select
                      value={formData[field.name] || ""}
                      onValueChange={(value) => handleFieldChange(field.name, value)}
                      required={!field.nullable}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${field.title || field.name}`} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] z-9999" position="popper" sideOffset={5}>
                        {field.enum.values.map((val, index) => (
                          <SelectItem key={val} value={val}>
                            {field.enum!.labels[index] || val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                ) : field.textarea ? (
                  <>
                    <Label htmlFor={`field-${field.name}`} className="text-sm font-medium">
                      {(translations as any)?.dataTable?.fields?.[state.collection]?.[field.name] || field.title || field.name}
                      {!field.nullable && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Textarea
                      id={`field-${field.name}`}
                      required={!field.nullable}
                      value={formData[field.name] || ""}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder={`Enter ${field.title || field.name}`}
                      rows={6}
                    />
                  </>
                ) : field.name === 'description' ? (
                  <>
                    <Label htmlFor={`field-${field.name}`} className="text-sm font-medium">
                      {(translations as any)?.dataTable?.fields?.[state.collection]?.[field.name] || field.title || field.name}
                      {!field.nullable && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Textarea
                      id={`field-${field.name}`}
                      required={!field.nullable}
                      value={formData[field.name] || ""}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder={t.form?.enter?.replace('{field}', field.title || field.name) || `Enter ${field.title || field.name}`}
                      rows={4}
                    />
                  </>
                ) : field.name === 'media_id' && state.collection === 'contractors' ? (
                  <>
                    <Label htmlFor={`field-${field.name}`} className="text-sm font-medium">
                      {(translations as any)?.dataTable?.fields?.[state.collection]?.[field.name] || field.title || field.name}
                      {!field.nullable && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <MediaUploadInput
                      value={formData[field.name] || ""}
                      onChange={(uuid) => handleFieldChange(field.name, uuid)}
                      disabled={false}
                      translations={t}
                    />
                  </>
                ) : (
                  <>
                    <Label htmlFor={`field-${field.name}`} className="text-sm font-medium">
                      {(translations as any)?.dataTable?.fields?.[state.collection]?.[field.name] || field.title || field.name}
                      {!field.nullable && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Input
                      id={`field-${field.name}`}
                      type={field.fieldType === 'email' ? 'email' : field.fieldType === 'number' ? 'number' : 'text'}
                      required={!field.nullable}
                      value={formData[field.name] || ""}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder={t.form?.enter?.replace('{field}', field.title || field.name) || `Enter ${field.title || field.name}`}
                    />
                  </>
                )}
                      </div>
                    ))}
                    </div>
                  </TabsContent>
                  {state.collection === 'roles' && (
                    <TabsContent value="info" className="mt-0">
                    <div className="grid gap-4">
                        {schema.filter((f) => ['id', 'uuid', 'order', 'created_at', 'updated_at'].includes(f.name)).map((field) => {
                          // For create form, these fields won't have values yet
                          const value = formData[field.name] ?? null
                          return (
                            <div key={field.name} className="flex flex-col gap-2">
                              <Label className="text-sm font-medium select-text">
                                {(translations as any)?.dataTable?.fields?.[state.collection]?.[field.name] || field.title || field.name}
                              </Label>
                              <div className="text-sm select-text">
                                {field.name === 'created_at' || field.name === 'updated_at' ? (
                                  <span className="select-text">
                                    {value ? formatDateTimeForLocale(value, locale) : '-'}
                                  </span>
                                ) : (
                                  <span className="select-text">
                                    {value ?? '-'}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </TabsContent>
                  )}
                  <TabsContent value="details" className="mt-0">
                    <div className="grid gap-4">
                      {/* Language tabs */}
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{t.editLanguage || "Language for editing"}</div>
                        <Tabs
                          value={createDataInLanguage}
                          onValueChange={(value) => setCreateDataInLanguage(value as LanguageCode)}
                          className="w-auto"
                        >
                          <TabsList className="h-8">
                            {LANGUAGES.filter((l) => enabledLanguageCodes.includes(l.code)).map((l) => (
                              <TabsTrigger key={l.code} value={l.code} className="text-xs px-2 py-1">
                                {l.shortName}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                        </Tabs>
                      </div>
                      
                      {/* Data_in fields */}
                      <div className="grid gap-4">
                        <div className="flex items-center justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                            onClick={() => {
                              // Add a new entry with a temporary unique key
                              const tempKey = `new_field_${Date.now()}`
                              setCreateDataInEntries((prev) => {
                                const newEntries = supportedLanguageCodes.map((lang) => ({
                                  key: `${tempKey}_${lang}`,
                                  title: '',
                                  value: '',
                                }))
                                return [...prev, ...newEntries]
                              })
                            }}
                        >
                          <IconPlus className="mr-2 h-4 w-4" />
                          {t.addField || "Add field"}
                        </Button>
                      </div>
                      <div className="grid gap-3">
                          {(() => {
                            const uniqueBaseKeys = getUniqueBaseKeys(createDataInEntries)
                            if (uniqueBaseKeys.length === 0) {
                              return <div className="text-sm text-muted-foreground">Нет полей</div>
                            }
                            return uniqueBaseKeys.map((baseKey, idx) => {
                              const { title: currentTitle, value: currentValue } = getTitleAndValueForLanguage(createDataInEntries, baseKey, createDataInLanguage)
                              const hasAnyValue = supportedLanguageCodes.some(lang => {
                                const { value } = getTitleAndValueForLanguage(createDataInEntries, baseKey, lang)
                                return value && value.trim() !== ''
                              })
                              
                              const tempKey = createKeyInputs[baseKey] ?? baseKey
                              const tempTitle = createTitleInputs[baseKey] ?? currentTitle
                              const tempValue = createValueInputs[baseKey] ?? currentValue
                              
                              return (
                                <div key={`create-entry-${baseKey}-${idx}`} className="flex gap-2 items-center">
                              <Input
                                    value={tempKey}
                                onChange={(e) => {
                                  const v = e.target.value
                                      // Update only the temporary state, don't update entries yet
                                      setCreateKeyInputs((prev) => ({
                                        ...prev,
                                        [baseKey]: v
                                      }))
                                    }}
                                    onBlur={(e) => {
                                      const v = e.target.value.trim()
                                      if (!v || v === baseKey) {
                                        // Reset to original if empty or unchanged
                                        setCreateKeyInputs((prev) => {
                                          const newState = { ...prev }
                                          delete newState[baseKey]
                                          return newState
                                        })
                                        return
                                      }
                                      // Update base key in all language entries
                                      setCreateDataInEntries((prev) => {
                                        const result: Array<{ key: string; title: string; value: string }> = []
                                        const oldData: Record<string, { title: string; value: string }> = {}
                                        
                                        // Collect old title and value for all languages
                                        supportedLanguageCodes.forEach(lang => {
                                          const oldLangKey = `${baseKey}_${lang}`
                                          const oldEntry = prev.find(e => e.key === oldLangKey)
                                          if (oldEntry) {
                                            oldData[lang] = { title: oldEntry.title, value: oldEntry.value }
                                          }
                                        })
                                        
                                        // Keep entries that don't match this base key
                                        prev.forEach(entry => {
                                          const langMatch = entry.key.match(/^(.+)_([a-z]{2})$/i)
                                          if (langMatch && langMatch[1] === baseKey) {
                                            return // Skip old entries for this base key
                                          }
                                          if (entry.key === baseKey) {
                                            return // Skip old entry without language suffix
                                          }
                                          result.push(entry)
                                        })
                                        
                                        // Add new entries with new base key
                                        supportedLanguageCodes.forEach(lang => {
                                          result.push({
                                            key: `${v}_${lang}`,
                                            title: oldData[lang]?.title || '',
                                            value: oldData[lang]?.value || ''
                                          })
                                        })
                                        
                                        // Update temp key state with new base key
                                        setCreateKeyInputs((prev) => {
                                          const newState = { ...prev }
                                          delete newState[baseKey]
                                          newState[v] = v
                                          return newState
                                        })
                                        
                                        return result
                                      })
                                    }}
                                    placeholder="Name (key)"
                                    className="flex-1"
                                  />
                                <Input
                                    value={tempTitle}
                                  onChange={(e) => {
                                    const v = e.target.value
                                      // Update only temporary state, don't update entries yet
                                      setCreateTitleInputs((prev) => ({
                                        ...prev,
                                        [baseKey]: v
                                      }))
                                    }}
                                    onBlur={(e) => {
                                      const v = e.target.value
                                      // Update title - duplicate to all languages if this is the first value entered
                                      setCreateDataInEntries((prev) => {
                                        const allEmpty = supportedLanguageCodes.every(l => {
                                          const { value } = getTitleAndValueForLanguage(prev, baseKey, l)
                                          return !value || value.trim() === ''
                                        })
                                        
                                        const currentData = getTitleAndValueForLanguage(prev, baseKey, createDataInLanguage)
                                        return updateTitleAndValueForLanguage(prev, baseKey, createDataInLanguage, v, currentData.value, allEmpty && currentData.value.trim() !== '')
                                      })
                                      // Clear temp state
                                      setCreateTitleInputs((prev) => {
                                        const newState = { ...prev }
                                        delete newState[baseKey]
                                        return newState
                                      })
                                    }}
                                    placeholder="Title"
                                    className="flex-1"
                                  />
                                  <Input
                                    value={tempValue}
                                    onChange={(e) => {
                                      const v = e.target.value
                                      // Update only temporary state, don't update entries yet
                                      setCreateValueInputs((prev) => ({
                                        ...prev,
                                        [baseKey]: v
                                      }))
                                    }}
                                    onBlur={(e) => {
                                      const v = e.target.value
                                      // Update value - duplicate to all languages if this is the first value entered
                                      setCreateDataInEntries((prev) => {
                                        // Check if this is the first value (all languages are empty)
                                        const allEmpty = supportedLanguageCodes.every(l => {
                                          const { value } = getTitleAndValueForLanguage(prev, baseKey, l)
                                          return !value || value.trim() === ''
                                        })
                                        
                                        const currentData = getTitleAndValueForLanguage(prev, baseKey, createDataInLanguage)
                                        return updateTitleAndValueForLanguage(prev, baseKey, createDataInLanguage, currentData.title, v, allEmpty && v.trim() !== '')
                                      })
                                      // Clear temp state
                                      setCreateValueInputs((prev) => {
                                        const newState = { ...prev }
                                        delete newState[baseKey]
                                        return newState
                                      })
                                  }}
                                  placeholder={(translations as any)?.dataTable?.valuePlaceholder || "Value (string or JSON)"}
                                    className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      // Remove all entries for this base key
                                      setCreateDataInEntries((prev) => {
                                        return prev.filter(entry => {
                                          const langMatch = entry.key.match(/^(.+)_([a-z]{2})$/i)
                                          if (langMatch && langMatch[1] === baseKey) {
                                            return false
                                          }
                                          return entry.key !== baseKey
                                        })
                                      })
                                    }}
                                  >
                                    <IconX className="h-4 w-4" />
                                  <span className="sr-only">Remove</span>
                                </Button>
                              </div>
                              )
                            })
                          })()}
                            </div>
                      </div>
                      
                      {/* Raw JSON */}
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">Raw JSON</div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              void copyToClipboard(createDataInRaw || "")
                            }}
                          >
                            <IconCopy className="mr-2 h-4 w-4" />
                            {t.copy || "Копировать"}
                          </Button>
                        </div>
                        <Textarea
                          value={createDataInRaw}
                          onChange={(e) => setCreateDataInRaw(e.target.value)}
                          className="font-mono text-xs"
                          rows={10}
                        />
                        {createDataInRawError ? (
                          <div className="text-sm text-destructive">{createDataInRawError}</div>
                        ) : null}
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              try {
                                const parsed = JSON.parse(createDataInRaw || "{}")
                                setCreateDataInEntries(objectToEntries(parsed))
                                setCreateDataInRawError(null)
                              } catch (e) {
                                setCreateDataInRawError(e instanceof Error ? e.message : String(e))
                              }
                            }}
                          >
                            {t.applyJson || "Apply JSON"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                {createError && (
                  <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    {createError}
                  </div>
                )}
              </div>
              <div className="border-t px-6 py-4">
                <ResponsiveDialogFooter className="m-0">
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                    {t.form?.cancel || "Cancel"}
                  </Button>
                  <Button type="submit">{t.form?.create || "Create"}</Button>
                </ResponsiveDialogFooter>
              </div>
            </form>
            <ResponsiveDialogClose className="sr-only" />
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={editOpen}
        onOpenChange={(open) => {
        setEditOpen(open)
        if (!open) {
          // Clear edit data and price inputs when dialog closes
          setEditData({})
          setEditError(null)
          setRecordToEdit(null)
          setIsDuplicate(false)
          setEditFormTab("main")
          setEditDataInLanguage(locale)
          setEditDataInEntries([])
          setEditDataInRaw("{}")
          setEditDataInRawError(null)
          setPriceInputs(prev => {
            const newInputs = { ...prev }
            schema.filter((f) => !isAutoGeneratedField(f.name, !!f.relation) && !f.primary && !f.hidden).forEach(field => {
              if (field.fieldType === 'price') {
                delete newInputs[`edit-${field.name}`]
              }
            })
            return newInputs
          })
        }
      }}
        onlyDrawer
        direction="right"
        handleOnly
      >
        <ResponsiveDialogContent className="h-[calc(100svh-16px)] w-[560px] max-w-[95vw] overflow-hidden p-0">
          <div className="flex h-full flex-col">
            <div className="border-b px-6 py-4">
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>
                  {isDuplicate 
                    ? (t.createRecord?.title || "Create record in {collection}").replace("{collection}", collectionLabel)
                    : (t.editRecord?.title || "Edit record in {collection}").replace("{collection}", collectionLabel)
                  }
                </ResponsiveDialogTitle>
                <ResponsiveDialogDescription>
                  {isDuplicate
                    ? (t.createRecord?.description || "Fill in the fields below. Auto-generated fields are not editable and hidden.")
                    : (t.editRecord?.description || "Change fields below. Auto-generated fields are not editable and hidden.")
                  }
                </ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
            </div>
            <form onSubmit={handleEditSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                <Tabs value={editFormTab} onValueChange={(v) => setEditFormTab(v as any)} className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="main">{t.tabs?.main || "Main"}</TabsTrigger>
                    {(state.collection === 'roles' || state.collection === 'contractors') && <TabsTrigger value="info">{t.tabs?.info || "Info"}</TabsTrigger>}
                    <TabsTrigger value="details">{t.tabs?.details || "Details"}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="main" className="mt-0">
                    <div className="grid gap-4">
                      {schema.filter((f) => {
                        // Debug log for contractors relation fields
                        if (state.collection === 'contractors' && (f.name === 'status_name' || f.name === 'city_name')) {
                          const isRelationField = !!f.relation
                          const shouldShow = !isAutoGeneratedField(f.name, isRelationField) && (!f.primary || isRelationField) && !f.hidden && String(f.name) !== "data_in"
                          console.log(`[DataTable Edit Form] Field ${f.name}:`, {
                            isAutoGenerated: isAutoGeneratedField(f.name, isRelationField),
                            hasRelation: isRelationField,
                            relation: f.relation,
                            isPrimary: f.primary,
                            isHidden: f.hidden,
                            shouldShow,
                            inList: ['title', 'reg', 'tin', 'status_name', 'city_name', 'order', 'media_id'].includes(f.name),
                          })
                        }
                        
                        // For relation fields, allow them even if primary (they might be marked as primary in DB schema)
                        const isRelationField = !!f.relation
                        const shouldShow = !isAutoGeneratedField(f.name, isRelationField) && (!f.primary || isRelationField) && !f.hidden && f.name !== "data_in"
                        
                        if (!shouldShow) {
                          // Debug log for filtered out fields in contractors
                          if (state.collection === 'contractors' && (f.name === 'status_name' || f.name === 'city_name')) {
                            console.warn(`[DataTable Edit Form] Field ${f.name} was filtered out:`, {
                              isAutoGenerated: isAutoGeneratedField(f.name, isRelationField),
                              isPrimary: f.primary,
                              isHidden: f.hidden,
                              hasRelation: isRelationField,
                            })
                          }
                          return false
                        }
                        
                        if (state.collection === 'roles') {
                          // For roles, show: title, name, description, is_system, order, xaid
                          return ['title', 'name', 'description', 'is_system', 'order', 'xaid'].includes(f.name)
                        }
                        if (state.collection === 'contractors') {
                          // For contractors, show: title, reg, tin, status_name, city_name, order, media_id
                          // Hide xaid (auto-generated from expanse selector)
                          if (f.name === 'xaid') return false
                          return ['title', 'reg', 'tin', 'status_name', 'city_name', 'order', 'media_id'].includes(f.name)
                        }
                        return true
                      }).map((field) => (
                    <div key={field.name} className="flex flex-col gap-2">
                {field.fieldType === 'boolean' ? (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`edit-field-${field.name}`}
                      checked={editData[field.name] === true}
                      onCheckedChange={(checked) => handleEditFieldChange(field.name, checked === true)}
                      disabled={field.readOnly}
                    />
                    <Label htmlFor={`edit-field-${field.name}`} className="text-sm font-medium cursor-pointer">
                      {(translations as any)?.dataTable?.fields?.[state.collection]?.[field.name] || field.title || field.name}
                    </Label>
                  </div>
                ) : field.fieldType === 'date' || field.fieldType === 'time' || field.fieldType === 'datetime' ? (
                  <>
                    <Label htmlFor={`edit-field-${field.name}`} className="text-sm font-medium">
                      {(translations as any)?.dataTable?.fields?.[state.collection]?.[field.name] || field.title || field.name}
                      {!field.nullable && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <DateTimePicker
                      mode={field.fieldType}
                      value={editData[field.name] || null}
                      onChange={(date) => handleEditFieldChange(field.name, date)}
                      placeholder={t.form?.select?.replace('{field}', field.title || field.name) || `Select ${field.title || field.name}`}
                      disabled={field.readOnly}
                    />
                  </>
                ) : field.fieldType === 'phone' ? (
                  <>
                    <Label htmlFor={`edit-field-${field.name}`} className="text-sm font-medium">
                      {(translations as any)?.dataTable?.fields?.[state.collection]?.[field.name] || field.title || field.name}
                      {!field.nullable && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <PhoneInput
                      value={editData[field.name] || ''}
                      onChange={(value) => handleEditFieldChange(field.name, value || '')}
                      placeholder={t.form?.enter?.replace('{field}', field.title || field.name) || `Enter ${field.title || field.name}`}
                      disabled={field.readOnly}
                    />
                  </>
                ) : field.fieldType === 'password' ? (
                  <>
                    <Label htmlFor={`edit-field-${field.name}`} className="text-sm font-medium">
                      {field.title || field.name} (leave empty to keep current)
                    </Label>
                    <Input
                      id={`edit-field-${field.name}`}
                      type="password"
                      value={editData[field.name] || ""}
                      onChange={(e) => handleEditFieldChange(field.name, e.target.value)}
                      placeholder={t.form?.enterNew?.replace('{field}', field.title || field.name) || `Enter new ${field.title || field.name}`}
                      disabled={field.readOnly}
                      minLength={8}
                    />
                    <Label htmlFor={`edit-field-${field.name}-confirm`} className="text-sm font-medium">
                      {t.form?.confirmNew?.replace('{field}', field.title || field.name) || `Confirm new ${field.title || field.name}`}
                    </Label>
                    <Input
                      id={`edit-field-${field.name}-confirm`}
                      type="password"
                      value={editData[`${field.name}_confirm`] || ""}
                      onChange={(e) => handleEditFieldChange(`${field.name}_confirm`, e.target.value)}
                      placeholder={t.form?.confirmNew?.replace('{field}', field.title || field.name) || `Confirm new ${field.title || field.name}`}
                      disabled={field.readOnly}
                      minLength={8}
                    />
                    {editData[field.name] && editData[`${field.name}_confirm`] && editData[field.name] !== editData[`${field.name}_confirm`] && (
                      <p className="text-sm text-destructive">{t.form?.passwordsDoNotMatch || "Passwords do not match"}</p>
                    )}
                  </>
                ) : field.fieldType === 'json' && getI18nJsonFieldsForCollection(state.collection).includes(field.name) ? (
                  <>
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`edit-field-${field.name}`} className="text-sm font-medium">
                        {(translations as any)?.dataTable?.fields?.[state.collection]?.[field.name] || field.title || field.name}
                        {!field.nullable && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      <Tabs
                        value={jsonFieldLanguage[field.name] || locale}
                        onValueChange={(value) => setJsonFieldLanguage((prev) => ({ ...prev, [field.name]: value as LanguageCode }))}
                        className="w-auto"
                      >
                        <TabsList className="h-8">
                          {LANGUAGES.filter((l) => enabledLanguageCodes.includes(l.code)).map((l) => (
                            <TabsTrigger key={l.code} value={l.code} className="text-xs px-2 py-1">
                              {l.shortName}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </Tabs>
                    </div>
                    <Tabs
                      value={jsonFieldLanguage[field.name] || locale}
                      onValueChange={(value) => setJsonFieldLanguage((prev) => ({ ...prev, [field.name]: value as LanguageCode }))}
                      className="w-full"
                    >
                      {LANGUAGES.filter((l) => enabledLanguageCodes.includes(l.code)).map((l) => (
                        <TabsContent key={l.code} value={l.code} className="mt-0">
                          <Input
                            id={`edit-field-${field.name}_${l.code}`}
                            type="text"
                            required={!field.nullable}
                            value={editData[`${field.name}_${l.code}`] || ""}
                            onChange={(e) => handleEditFieldChange(`${field.name}_${l.code}`, e.target.value)}
                            placeholder={
                              t.form?.enter?.replace('{field}', `${field.title || field.name} (${l.name})`) ||
                              `Enter ${field.title || field.name} (${l.name})`
                            }
                            disabled={field.readOnly}
                          />
                        </TabsContent>
                      ))}
                    </Tabs>
                  </>
                ) : (field as any).fieldType === 'price' ? (
                  <>
                    <Label htmlFor={`edit-field-${field.name}`} className="text-sm font-medium">
                      {(translations as any)?.dataTable?.fields?.[state.collection]?.[field.name] || field.title || field.name}
                      {!field.nullable && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Input
                      id={`edit-field-${field.name}`}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      required={!field.nullable}
                      disabled={field.readOnly}
                      value={
                        priceInputs[`edit-${field.name}`] !== undefined
                          ? priceInputs[`edit-${field.name}`]
                          : editData[field.name] === undefined || editData[field.name] === null
                            ? ""
                            : (Number(editData[field.name]) / 100).toFixed(2)
                      }
                      onChange={(e) => {
                        let v = e.target.value.replace(/,/g, '.')
                        setPriceInputs((prev) => ({ ...prev, [`edit-${field.name}`]: v }))
                        if (v.includes('.')) {
                          const [i, d] = v.split('.')
                          v = `${i}.${d.slice(0, 2)}`
                        }
                        const num = v === '' ? NaN : Number(v)
                        const cents = !isFinite(num) ? null : Math.round(num * 100)
                        handleEditFieldChange(field.name, cents)
                      }}
                      onBlur={(e) => {
                        let v = e.target.value.replace(/,/g, '.')
                        if (v.includes('.')) {
                          const [i, d] = v.split('.')
                          v = `${i}.${d.slice(0, 2)}`
                        }
                        const num = v === '' ? NaN : Number(v)
                        if (isFinite(num)) {
                          const formatted = num.toFixed(2)
                          setPriceInputs((prev) => ({ ...prev, [`edit-${field.name}`]: formatted }))
                          const cents = Math.round(num * 100)
                          handleEditFieldChange(field.name, cents)
                        }
                      }}
                      placeholder={`Enter ${field.title || field.name}`}
                    />
                  </>
                ) : field.relation && typeof field.relation === 'object' && field.relation.collection ? (
                  <>
                    <Label htmlFor={`edit-field-${field.name}`} className="text-sm font-medium">
                      {(translations as any)?.dataTable?.fields?.[state.collection]?.[field.name] || field.title || field.name}
                      {!field.nullable && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <RelationSelect
                      relation={field.relation}
                      value={editData[field.name]}
                      onChange={(value) => handleEditFieldChange(field.name, value)}
                      disabled={field.readOnly}
                      required={!field.nullable}
                      translations={t}
                      search={state.search}
                      locale={locale}
                    />
                  </>
                ) : field.fieldType === 'select' && field.selectOptions ? (
                  <>
                    <Label htmlFor={`edit-field-${field.name}`} className="text-sm font-medium">
                      {(translations as any)?.dataTable?.fields?.[state.collection]?.[field.name] || field.title || field.name}
                      {!field.nullable && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <ComboboxSelect
                      id={`edit-field-${field.name}`}
                      options={field.selectOptions}
                      value={editData[field.name] || ""}
                      onValueChange={(value) => handleEditFieldChange(field.name, value)}
                      placeholder={t.form?.select?.replace('{field}', field.title || field.name) || `Select ${field.title || field.name}`}
                      disabled={field.readOnly}
                      required={!field.nullable}
                      translations={t}
                    />
                  </>
                ) : field.textarea ? (
                  <>
                    <Label htmlFor={`edit-field-${field.name}`} className="text-sm font-medium">
                      {(translations as any)?.dataTable?.fields?.[state.collection]?.[field.name] || field.title || field.name}
                      {!field.nullable && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Textarea
                      id={`edit-field-${field.name}`}
                      required={!field.nullable}
                      value={editData[field.name] || ''}
                      onChange={(e) => handleEditFieldChange(field.name, e.target.value)}
                      disabled={field.readOnly}
                      rows={6}
                    />
                  </>
                ) : field.name === 'description' ? (
                  <>
                    <Label htmlFor={`edit-field-${field.name}`} className="text-sm font-medium">
                      {(translations as any)?.dataTable?.fields?.[state.collection]?.[field.name] || field.title || field.name}
                      {!field.nullable && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Textarea
                      id={`edit-field-${field.name}`}
                      required={!field.nullable}
                      value={editData[field.name] || ''}
                      onChange={(e) => handleEditFieldChange(field.name, e.target.value)}
                      placeholder={t.form?.enter?.replace('{field}', field.title || field.name) || `Enter ${field.title || field.name}`}
                      disabled={field.readOnly}
                      rows={4}
                    />
                  </>
                ) : field.name === 'media_id' && state.collection === 'contractors' ? (
                  <>
                    <Label htmlFor={`edit-field-${field.name}`} className="text-sm font-medium">
                      {(translations as any)?.dataTable?.fields?.[state.collection]?.[field.name] || field.title || field.name}
                      {!field.nullable && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <MediaUploadInput
                      value={editData[field.name] || ""}
                      onChange={(uuid) => handleEditFieldChange(field.name, uuid)}
                      disabled={field.readOnly}
                      translations={t}
                    />
                  </>
                ) : (
                  <>
                    <Label htmlFor={`edit-field-${field.name}`} className="text-sm font-medium">
                      {(translations as any)?.dataTable?.fields?.[state.collection]?.[field.name] || field.title || field.name}
                      {!field.nullable && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Input
                      id={`edit-field-${field.name}`}
                      type={field.fieldType === 'email' ? 'email' : field.fieldType === 'number' ? 'number' : 'text'}
                      required={!field.nullable}
                      value={editData[field.name] || ''}
                      onChange={(e) => handleEditFieldChange(field.name, e.target.value)}
                      placeholder={t.form?.enter?.replace('{field}', field.title || field.name) || `Enter ${field.title || field.name}`}
                      disabled={field.readOnly}
                    />
                  </>
                )}
                      </div>
                    ))}
                    </div>
                  </TabsContent>
                  {state.collection === 'roles' && (
                    <TabsContent value="info" className="mt-0">
                    <div className="grid gap-4">
                        {schema.filter((f) => ['id', 'uuid', 'order', 'created_at', 'updated_at'].includes(f.name)).map((field) => {
                          // Use recordToEdit for edit form to get original data
                          const value = recordToEdit?.[field.name] ?? editData[field.name] ?? null
                          return (
                            <div key={field.name} className="flex flex-col gap-2">
                              <Label className="text-sm font-medium select-text">
                                {(translations as any)?.dataTable?.fields?.[state.collection]?.[field.name] || field.title || field.name}
                              </Label>
                              <div className="text-sm select-text">
                                {field.name === 'created_at' || field.name === 'updated_at' ? (
                                  <span className="select-text">
                                    {value ? formatDateTimeForLocale(value, locale) : '-'}
                                  </span>
                                ) : (
                                  <span className="select-text">
                                    {value ?? '-'}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </TabsContent>
                  )}
                  <TabsContent value="details" className="mt-0">
                    <div className="grid gap-4">
                      {/* Language tabs */}
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{t.editLanguage || "Language for editing"}</div>
                        <Tabs
                          value={editDataInLanguage}
                          onValueChange={(value) => setEditDataInLanguage(value as LanguageCode)}
                          className="w-auto"
                        >
                          <TabsList className="h-8">
                            {LANGUAGES.filter((l) => enabledLanguageCodes.includes(l.code)).map((l) => (
                              <TabsTrigger key={l.code} value={l.code} className="text-xs px-2 py-1">
                                {l.shortName}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                        </Tabs>
                      </div>
                      
                      {/* Data_in fields */}
                      <div className="grid gap-4">
                        <div className="flex items-center justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                            onClick={() => {
                              // Add a new entry with a temporary unique key
                              const tempKey = `new_field_${Date.now()}`
                              setEditDataInEntries((prev) => {
                                const newEntries = supportedLanguageCodes.map((lang) => ({
                                  key: `${tempKey}_${lang}`,
                                  title: '',
                                  value: '',
                                }))
                                return [...prev, ...newEntries]
                              })
                            }}
                        >
                          <IconPlus className="mr-2 h-4 w-4" />
                          {t.addField || "Add field"}
                        </Button>
                      </div>
                      <div className="grid gap-3">
                          {(() => {
                            const uniqueBaseKeys = getUniqueBaseKeys(editDataInEntries)
                            if (uniqueBaseKeys.length === 0) {
                              return <div className="text-sm text-muted-foreground">Нет полей</div>
                            }
                            return uniqueBaseKeys.map((baseKey, idx) => {
                              const { title: currentTitle, value: currentValue } = getTitleAndValueForLanguage(editDataInEntries, baseKey, editDataInLanguage)
                              const hasAnyValue = supportedLanguageCodes.some(lang => {
                                const { value } = getTitleAndValueForLanguage(editDataInEntries, baseKey, lang)
                                return value && value.trim() !== ''
                              })
                              
                              const tempKey = editKeyInputs[baseKey] ?? baseKey
                              const tempTitle = editTitleInputs[baseKey] ?? currentTitle
                              const tempValue = editValueInputs[baseKey] ?? currentValue
                              
                              return (
                                <div key={`edit-entry-${baseKey}-${idx}`} className="flex gap-2 items-center">
                              <Input
                                    value={tempKey}
                                onChange={(e) => {
                                  const v = e.target.value
                                      // Update only the temporary state, don't update entries yet
                                      setEditKeyInputs((prev) => ({
                                        ...prev,
                                        [baseKey]: v
                                      }))
                                    }}
                                    onBlur={(e) => {
                                      const v = e.target.value.trim()
                                      if (!v || v === baseKey) {
                                        // Reset to original if empty or unchanged
                                        setEditKeyInputs((prev) => {
                                          const newState = { ...prev }
                                          delete newState[baseKey]
                                          return newState
                                        })
                                        return
                                      }
                                      // Update base key in all language entries
                                      setEditDataInEntries((prev) => {
                                        const result: Array<{ key: string; title: string; value: string }> = []
                                        const oldData: Record<string, { title: string; value: string }> = {}
                                        
                                        // Collect old title and value for all languages
                                        supportedLanguageCodes.forEach(lang => {
                                          const oldLangKey = `${baseKey}_${lang}`
                                          const oldEntry = prev.find(e => e.key === oldLangKey)
                                          if (oldEntry) {
                                            oldData[lang] = { title: oldEntry.title, value: oldEntry.value }
                                          }
                                        })
                                        
                                        // Keep entries that don't match this base key
                                        prev.forEach(entry => {
                                          const langMatch = entry.key.match(/^(.+)_([a-z]{2})$/i)
                                          if (langMatch && langMatch[1] === baseKey) {
                                            return // Skip old entries for this base key
                                          }
                                          if (entry.key === baseKey) {
                                            return // Skip old entry without language suffix
                                          }
                                          result.push(entry)
                                        })
                                        
                                        // Add new entries with new base key
                                        supportedLanguageCodes.forEach(lang => {
                                          result.push({
                                            key: `${v}_${lang}`,
                                            title: oldData[lang]?.title || '',
                                            value: oldData[lang]?.value || ''
                                          })
                                        })
                                        
                                        // Update temp key state with new base key
                                        setEditKeyInputs((prev) => {
                                          const newState = { ...prev }
                                          delete newState[baseKey]
                                          newState[v] = v
                                          return newState
                                        })
                                        
                                        return result
                                      })
                                    }}
                                    placeholder="Name (key)"
                                    className="flex-1"
                                  />
                                <Input
                                    value={tempTitle}
                                  onChange={(e) => {
                                    const v = e.target.value
                                      // Update only temporary state, don't update entries yet
                                      setEditTitleInputs((prev) => ({
                                        ...prev,
                                        [baseKey]: v
                                      }))
                                    }}
                                    onBlur={(e) => {
                                      const v = e.target.value
                                      // Update title - duplicate to all languages if this is the first value entered
                                      setEditDataInEntries((prev) => {
                                        const allEmpty = supportedLanguageCodes.every(l => {
                                          const { value } = getTitleAndValueForLanguage(prev, baseKey, l)
                                          return !value || value.trim() === ''
                                        })
                                        
                                        const currentData = getTitleAndValueForLanguage(prev, baseKey, editDataInLanguage)
                                        return updateTitleAndValueForLanguage(prev, baseKey, editDataInLanguage, v, currentData.value, allEmpty && currentData.value.trim() !== '')
                                      })
                                      // Clear temp state
                                      setEditTitleInputs((prev) => {
                                        const newState = { ...prev }
                                        delete newState[baseKey]
                                        return newState
                                      })
                                    }}
                                    placeholder="Title"
                                    className="flex-1"
                                  />
                                  <Input
                                    value={tempValue}
                                    onChange={(e) => {
                                      const v = e.target.value
                                      // Update only temporary state, don't update entries yet
                                      setEditValueInputs((prev) => ({
                                        ...prev,
                                        [baseKey]: v
                                      }))
                                    }}
                                    onBlur={(e) => {
                                      const v = e.target.value
                                      // Update value - duplicate to all languages if this is the first value entered
                                      setEditDataInEntries((prev) => {
                                        // Check if this is the first value (all languages are empty)
                                        const allEmpty = supportedLanguageCodes.every(l => {
                                          const { value } = getTitleAndValueForLanguage(prev, baseKey, l)
                                          return !value || value.trim() === ''
                                        })
                                        
                                        const currentData = getTitleAndValueForLanguage(prev, baseKey, editDataInLanguage)
                                        return updateTitleAndValueForLanguage(prev, baseKey, editDataInLanguage, currentData.title, v, allEmpty && v.trim() !== '')
                                      })
                                      // Clear temp state
                                      setEditValueInputs((prev) => {
                                        const newState = { ...prev }
                                        delete newState[baseKey]
                                        return newState
                                      })
                                  }}
                                  placeholder={(translations as any)?.dataTable?.valuePlaceholder || "Value (string or JSON)"}
                                    className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    // Remove all entries for this base key
                                    setEditDataInEntries((prev) => {
                                      return prev.filter(entry => {
                                        const langMatch = entry.key.match(/^(.+)_([a-z]{2})$/i)
                                        if (langMatch && langMatch[1] === baseKey) {
                                          return false
                                        }
                                        return entry.key !== baseKey
                                      })
                                    })
                                  }}
                                >
                                  <IconX className="h-4 w-4" />
                                  <span className="sr-only">Remove</span>
                                </Button>
                              </div>
                              )
                            })
                          })()}
                      </div>
                      </div>
                      
                      {/* Raw JSON */}
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">Raw JSON</div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              void copyToClipboard(editDataInRaw || "")
                            }}
                          >
                            <IconCopy className="mr-2 h-4 w-4" />
                            {t.copy || "Copy"}
                          </Button>
                        </div>
                        <Textarea
                          value={editDataInRaw}
                          onChange={(e) => setEditDataInRaw(e.target.value)}
                          className="font-mono text-xs"
                          rows={10}
                        />
                        {editDataInRawError ? (
                          <div className="text-sm text-destructive">{editDataInRawError}</div>
                        ) : null}
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              try {
                                const parsed = JSON.parse(editDataInRaw || "{}")
                                setEditDataInEntries(objectToEntries(parsed))
                                setEditDataInRawError(null)
                              } catch (e) {
                                setEditDataInRawError(e instanceof Error ? e.message : String(e))
                              }
                            }}
                          >
                            {t.applyJson || "Apply JSON"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                {editError && (
                  <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    {editError}
                  </div>
                )}
              </div>
              <div className="border-t px-6 py-4">
                <ResponsiveDialogFooter className="m-0 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {!isDuplicate && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={navigateToPrevious}
                          disabled={!hasPreviousRecord}
                          title={t.previousRecord}
                        >
                          <IconChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={navigateToNext}
                          disabled={!hasNextRecord}
                          title={t.nextRecord}
                        >
                          <IconChevronRight className="h-4 w-4" />
                        </Button>
                        {currentRowIndex >= 0 && (
                          <span className="text-sm text-muted-foreground px-2">
                            {currentRowIndex + 1} / {table?.getRowModel().rows.length || 0}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                    {t.form?.cancel || "Cancel"}
                  </Button>
                  <Button type="submit">{t.form?.save || "Save"}</Button>
                  </div>
                </ResponsiveDialogFooter>
              </div>
            </form>
            <ResponsiveDialogClose className="sr-only" />
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Export Dialog */}
      <ResponsiveDialog open={exportOpen} onOpenChange={setExportOpen}>
        <ResponsiveDialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <ResponsiveDialogHeader className="px-6 pt-6 pb-4">
            <ResponsiveDialogTitle>{t.exportData}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {(t.exportedRecords || "Exported {count} records in {format} format").replace('{count}', String(table.getFilteredRowModel().rows.length)).replace('{format}', exportFormat.toUpperCase())}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="flex-1 overflow-auto min-h-0 px-6 py-4">
            <Textarea
              value={exportData}
              readOnly
              className="font-mono text-sm min-h-[300px] resize-none w-full"
              style={{ whiteSpace: exportFormat === 'json' ? 'pre' : 'pre-wrap' }}
            />
          </div>
          <ResponsiveDialogFooter className="shrink-0 px-6 py-4">
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              {t.close}
            </Button>
            <Button variant="outline" onClick={handleExportCopy}>
              <IconCopy className="mr-2 h-4 w-4" />
              {exportCopied ? t.copied : t.copy}
            </Button>
            <Button onClick={handleExportDownload}>
              <IconDownload className="mr-2 h-4 w-4" />
              {t.downloadFile}
            </Button>
          </ResponsiveDialogFooter>
          <ResponsiveDialogClose className="sr-only" />
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Import Dialog */}
      <ResponsiveDialog open={importOpen} onOpenChange={handleImportDialogChange}>
        <ResponsiveDialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <ResponsiveDialogHeader className="px-6 pt-6 pb-4">
            <ResponsiveDialogTitle>{t.importData}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {(t.importDescription || "Load a file or paste data to import into {collection} collection").replace('{collection}', state.collection)}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="flex-1 overflow-auto min-h-0 px-6 py-4 space-y-4">
            <div className="space-y-2">
              <Label>{t.fileFormat}</Label>
              <Select value={importFormat} onValueChange={(value) => {
                const newFormat = value as ImportFormat
                setImportFormat(newFormat)
                setImportFile(null)
                setImportText('')
                // Excel doesn't support paste mode, switch to file mode
                if (newFormat === 'xls') {
                  setImportMode('file')
                }
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xls">Excel (XLS)</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="sql">SQL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(importFormat === 'csv' || importFormat === 'json' || importFormat === 'sql') && (
              <div className="space-y-2">
                <Label>{t.importMode}</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={importMode === 'file' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setImportMode('file')}
                    disabled={importing}
                  >
                    {t.loadFile}
                  </Button>
                  <Button
                    type="button"
                    variant={importMode === 'paste' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setImportMode('paste')}
                    disabled={importing}
                  >
                    {t.pasteText}
                  </Button>
                </div>
              </div>
            )}
            {importMode === 'file' ? (
              <div className="space-y-2">
                <Label>{t.file}</Label>
                <Input
                  type="file"
                  accept={importFormat === 'csv' ? '.csv' : importFormat === 'xls' ? '.xls,.xlsx' : importFormat === 'json' ? '.json' : '.sql'}
                  onChange={handleImportFileSelect}
                  disabled={importing}
                />
              {importFile && (
                <p className="text-sm text-muted-foreground">
                  {(t.selectedFile || "Selected file: {name} ({size} KB)").replace('{name}', importFile.name).replace('{size}', (importFile.size / 1024).toFixed(2))}
                </p>
              )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label>{t.pasteData}</Label>
                <Textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={(t.pasteDataPlaceholder || "Paste data in {format} format...").replace('{format}', importFormat.toUpperCase())}
                  className="font-mono text-sm min-h-[300px] resize-none"
                  disabled={importing}
                  style={{ whiteSpace: importFormat === 'json' ? 'pre' : 'pre-wrap' }}
                />
              </div>
            )}
            {importing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{t.importing}</span>
                  <span>{importProgress.imported} / {importProgress.total}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${importProgress.total > 0 ? (importProgress.imported / importProgress.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}
            {importResult && (
              <div className={`rounded-lg border p-4 ${importResult.success ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-destructive bg-destructive/10'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {importResult.success ? (
                    <IconCheck className="h-5 w-5 text-green-600" />
                  ) : (
                    <IconX className="h-5 w-5 text-destructive" />
                  )}
                  <span className={`font-semibold ${importResult.success ? 'text-green-700 dark:text-green-400' : 'text-destructive'}`}>
                    {(t.importedRecords || "Imported: {count} records").replace('{count}', String(importResult.imported))}
                  </span>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-semibold text-destructive">{t.errors}</p>
                    <ul className="text-sm text-destructive list-disc list-inside space-y-1 max-h-40 overflow-y-auto">
                      {importResult.errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          <ResponsiveDialogFooter className="shrink-0 px-6 py-4">
            <Button variant="outline" onClick={handleImportClose} disabled={importing}>
              {importResult ? t.close : t.form?.cancel}
            </Button>
            <Button onClick={handleImport} disabled={(importMode === 'file' && !importFile) || (importMode === 'paste' && !importText.trim()) || importing}>
              {importing ? (
                <>
                  <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                  {t.importing}
                </>
              ) : (
                <>
                  <IconUpload className="mr-2 h-4 w-4" />
                  {t.importButton}
                </>
              )}
            </Button>
          </ResponsiveDialogFooter>
          <ResponsiveDialogClose className="sr-only" />
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </Tabs>
  )
}


const defaultT = {
  search: "Search...",
  customizeColumns: "Customize Columns",
  columns: "Columns",
  add: "Add",
  noDataFound: "No data found in {collection}.",
  selectedRecords: "{count} selected · {total} total records",
  rowsPerPage: "Rows per page",
  page: "Page {page} of {total}",
  addRecord: {
    title: "Add new record to {collection}",
    description: "Fill in the fields below. Auto-generated fields (id, uuid, aid/raid/haid, created_at, updated_at, deleted_at) are hidden and will be created automatically."
  },
  form: {
    select: "Select {field}",
    enter: "Enter {field}",
    confirm: "Confirm {field}",
    confirmNew: "Confirm new {field}",
    enterNew: "Enter new {field}",
    loading: "Loading...",
    selectPlaceholder: "Select...",
    cancel: "Cancel",
    create: "Create",
    save: "Save",
    passwordsDoNotMatch: "Passwords do not match"
  },
  editRecord: {
    title: "Edit record in {collection}",
    description: "Change fields below. Auto-generated fields are not editable and hidden."
  },
  createRecord: {
    title: "Create record in {collection}",
    description: "Fill in the fields below. Auto-generated fields are not editable and hidden."
  },
  loading: "Loading {collection}...",
  actions: {
    view: "View",
    edit: "Edit"
  },
  delete: {
    selected: "Delete Selected",
    delete: "Delete",
    deleteRecord: {
      title: "Delete record?",
      description: "This action cannot be undone. You are about to delete one record from \"{collection}\"."
    },
    deleteSelected: {
      title: "Delete selected records?",
      description: "This action cannot be undone. You are about to delete {count} records from \"{collection}\".",
      deleting: "Deleting...",
      deleteAll: "Delete All"
    }
  },
  export: "Export",
  import: "Import",
  configureTable: "Configure Table",
  exportData: "Export Data",
  importData: "Import Data",
  exportedRecords: "Exported {count} records in {format} format",
  importDescription: "Load a file or paste data to import into {collection} collection",
  fileFormat: "File Format",
  importMode: "Import Mode",
  loadFile: "Load File",
  pasteText: "Paste Text",
  file: "File",
  pasteData: "Paste Data",
  importing: "Importing...",
  importedRecords: "Imported: {count} records",
  importButton: "Import",
  close: "Close",
  selectedFile: "Selected file: {name} ({size} KB)",
  pasteDataPlaceholder: "Paste data in {format} format...",
  errors: "Errors:",
  copy: "Copy",
  copied: "Copied!",
  downloadFile: "Download File",
  showColumn: "Show Column",
  defaultSorting: "Default Sorting",
  alignment: "Alignment",
  none: "None",
  asc: "A-Z",
  desc: "Z-A",
  left: "Left",
  center: "Center",
  right: "Right",
  dataInFields: "Additional",
  showFilters: "Фильтры в столбцах",
  cardView: "Card View",
  cardViewMobile: "Card View (Mobile)",
  cardViewDesktop: "Card View (Desktop)",
  cardsPerRow: "Cards per row",
  sortTooltipMultiple: "Click: change sort | Shift+Click: add to sort",
  sortTooltipSingle: "Click: sort | Shift+Click: add to sort",
  filterPlaceholder: "Filter...",
  valuePlaceholder: "Value (string or JSON)",
  previousRecord: "Previous record",
  nextRecord: "Next record",
  importNoData: "File contains no data to import",
  importError: "Error importing file",
  main: "Main",
  tabs: {
    main: "Main",
    info: "Info",
    details: "Details"
  },
  editLanguage: "Language for editing",
  applyJson: "Apply JSON",
  selectFile: "Select file",
  fileNotSelected: "No file selected",
  addField: "Add field",
  width: "Width",
  widthAuto: "Auto",
  widthReset: "Reset",
  widthPixels: "pixels",
  statusFilter: {
    filter: "По статусу",
    filterBy: "Filter by status",
    clear: "Clear filter",
    selected: "selected",
    selectedPlural: "selected"
  },
  cityFilter: {
    filter: "По городу",
    filterBy: "Filter by city",
    clear: "Clear filter",
    selected: "selected",
    selectedPlural: "selected"
  },
  filterSettings: "Filter Settings",
  filters: "Кнопки-фильтры",
  showColumnFilters: "Фильтры в столбцах",
  dateFilter: {
    filter: "По дате",
    filterBy: "Filter by",
    created: "Created",
    updated: "Updated",
    today: "Today",
    yesterday: "Yesterday",
    last7days: "Last 7 days",
    last30days: "Last 30 days",
    last90days: "Last 90 days",
    thisMonth: "This month",
    lastMonth: "Last month",
    thisYear: "This year",
    lastYear: "Last year",
    clear: "Clear filter",
    selectDate: "Select date",
    dateRange: "Date range",
    from: "From",
    to: "To",
    apply: "Apply"
  }
}