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
} from "@tabler/icons-react"
import { getCollection } from "@/shared/collections/getCollection"
import type { AdminFilter } from "@/shared/types"
import { parseSearchQuery, matchesSearchQuery, type ParsedSearchQuery, type SearchCondition } from "@/shared/utils/search-parser"
import { exportTable, getFileExtension, getMimeType, addBOM, type ExportFormat } from "@/shared/utils/table-export"
import { DateTimePicker } from "@/packages/components/ui/date-time-picker"
import { PhoneInput } from "@/packages/components/ui/phone-input"
import qs from "qs"
import { LANGUAGES, PROJECT_SETTINGS } from "@/settings"
import { useMe } from "@/providers/MeProvider"
import {
  getTableDataInFields,
  getTableColumnVisibility,
  type DataInField,
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

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Check, ChevronsUpDown } from "lucide-react"
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
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-[10002]" align="start">
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
}: {
  options: Array<{ value: string; label: string }>
  value: string[]
  onValueChange: (value: string[]) => void
  placeholder?: string
}) {
  const [open, setOpen] = React.useState(false)

  const selectedValues = Array.isArray(value) ? value : []
  const selectedOptions = options.filter((opt) => selectedValues.includes(opt.value))

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
              ? `${selectedOptions.length} выбрано`
              : placeholder || "Выберите..."}
          </span>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-[10002]" align="start">
        <Command>
          <CommandInput placeholder="Поиск..." className="h-8" />
          <CommandList>
            <CommandEmpty>Ничего не найдено</CommandEmpty>
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

// Relation Select Component
function RelationSelect({
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
        
        console.log(`[RelationSelect] Loaded ${opts.length} options for ${relation.collection}:`, opts)
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
    <Select value={value ? String(value) : ""} onValueChange={onChange} disabled={disabled || loading} required={required}>
      <SelectTrigger>
        <SelectValue placeholder={loading ? (translations?.form?.loading || "Loading...") : (translations?.form?.selectPlaceholder || "Select...")} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px] z-[10002]" position="popper" sideOffset={5}>
        {options.length === 0 && !loading ? (
          <div className="p-2 text-sm text-muted-foreground">No options available</div>
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

// Dynamic column generator
function generateColumns(schema: ColumnSchemaExtended[], onDeleteRequest: (row: Row<CollectionData>) => void, onEditRequest: (row: Row<CollectionData>) => void, onDuplicateRequest?: (row: Row<CollectionData>) => void, locale: string = 'en', relationData: Record<string, Record<any, string>> = {}, translations?: any, collection?: string, data?: CollectionData[], columnVisibility?: VisibilityState, columnAlignment?: Record<string, 'left' | 'center' | 'right'>): ColumnDef<CollectionData>[] {
  return [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
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
      <div className="flex items-center justify-center">
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
    ...schema.filter(col => !col.hidden && !col.hiddenTable).map((col) => ({
      accessorKey: col.name,
      enableSorting: true,
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
            title={column.getCanSort() ? (hasMultipleSorts ? "Клик: изменить сортировку | Shift+Клик: добавить к сортировке" : "Клик: сортировать | Shift+Клик: добавить к сортировке") : undefined}
          >
            <div className={`flex items-center gap-1 ${headerAlignClass}`}>
              <span>{col.title || col.name}</span>
              {col.primary && (
                <Badge variant="outline" className="text-[10px] px-1 py-0">
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
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 min-w-4 flex items-center justify-center font-semibold">
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
        const value = row.original[col.name]
        // Get alignment for this column
        const alignment = columnAlignment?.[col.name] || (col.name === 'is_system' || col.name === 'order' ? 'center' : 'left')
        const alignmentClass = alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left'
        
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
                <span className="sr-only">Copy</span>
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
        // Also handle title field in roles collection
        if (col.fieldType === 'json' && ((collection === 'taxonomy' && (col.name === 'title' || col.name === 'category')) || (collection === 'roles' && col.name === 'title'))) {
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
            const localizedValue =
              jsonValue[locale] ||
              jsonValue.en ||
              jsonValue.ru ||
              jsonValue.rs ||
              value ||
              "-"
            return <div className={alignmentClass}>{localizedValue}</div>
          }
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
    })),
    // Add virtual suffix column for roles collection
    ...(collection === 'roles' ? [{
      accessorKey: 'suffix',
      enableSorting: true,
      header: ({ column, table }: HeaderContext<CollectionData, unknown>) => {
        const sortedIndex = table.getState().sorting.findIndex((s: any) => s.id === column.id)
        const isSorted = column.getIsSorted()
        const hasMultipleSorts = table.getState().sorting.length > 1
        
        // Try to get title from data_in in first record
        let suffixTitle: string | null = null
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
                  const suffixKey = Object.keys(parsed).find(key => key.toLowerCase() === 'suffix')
                  if (suffixKey && parsed[suffixKey] !== undefined) {
                    const suffix = parsed[suffixKey]
                    if (typeof suffix === 'object' && suffix !== null && !Array.isArray(suffix)) {
                      const localeValue = suffix[locale] || suffix.en || suffix.ru || suffix.rs || null
                      if (localeValue !== null && localeValue !== undefined && typeof localeValue === 'object' && 'title' in localeValue) {
                        suffixTitle = localeValue.title || null
                        if (suffixTitle) break
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
        // Fallback to translation or default
        const suffixTranslation = (translations as any)?.dataTable?.fields?.roles?.suffix
        const columnTitle = suffixTitle || suffixTranslation || 'Suffix'
        
        // Get alignment for suffix column
        const alignment = columnAlignment?.['suffix'] || 'left'
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
            title={hasMultipleSorts ? "Клик: изменить сортировку | Shift+Клик: добавить к сортировке" : "Клик: сортировать | Shift+Клик: добавить к сортировке"}
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
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 min-w-4 flex items-center justify-center font-semibold">
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
      cell: ({ row }: { row: Row<CollectionData> }) => {
        const dataIn = row.original.data_in
        let suffixValue: string | null = null
        
        if (dataIn) {
          try {
            // Parse data_in if it's a string
            let parsed: any = dataIn
            if (typeof dataIn === 'string') {
              try {
                parsed = JSON.parse(dataIn)
              } catch (e) {
                // If parsing fails, treat as plain string
                parsed = null
              }
            }
            
            // Extract suffix value (case-insensitive search)
            if (parsed && typeof parsed === 'object') {
              const suffixKey = Object.keys(parsed).find(key => key.toLowerCase() === 'suffix')
              if (suffixKey && parsed[suffixKey] !== undefined) {
                const suffix = parsed[suffixKey]
                
                // If suffix is an object with language keys
                if (typeof suffix === 'object' && suffix !== null && !Array.isArray(suffix)) {
                  // Try current locale first, then fallback to en, ru, rs
                  const localeValue = suffix[locale] || suffix.en || suffix.ru || suffix.rs || null
                  if (localeValue !== null && localeValue !== undefined) {
                    // Check if localeValue is an object with title and value structure
                    if (typeof localeValue === 'object' && 'value' in localeValue) {
                      suffixValue = localeValue.value != null ? String(localeValue.value) : null
                    } else {
                      // If it's a simple value (string, number, etc.)
                      suffixValue = String(localeValue)
                    }
                  }
                } else if (suffix !== null && suffix !== undefined) {
                  // If suffix is a simple value (string, number, etc.)
                  suffixValue = String(suffix)
                }
              }
            }
          } catch (e) {
            // Ignore parse errors
            console.warn('Failed to parse suffix from data_in:', e)
          }
        }
        
        // Get alignment for suffix column
        const alignment = columnAlignment?.['suffix'] || 'left'
        const alignmentClass = alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left'
        
        return <div className={alignmentClass}>{suffixValue || '-'}</div>
      },
    }] : []),
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
      // Exclude 'suffix' for roles collection as it has a virtual column
      return Array.from(allDataInKeys)
        .filter((baseKey) => {
          // Skip suffix for roles as it's handled by virtual column
          if (collection === 'roles' && baseKey.toLowerCase() === 'suffix') {
            return false
          }
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
          const fieldTranslation = (translations as any)?.dataTable?.fields?.[collection || '']?.[baseKey]
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
                  title={hasMultipleSorts ? "Клик: изменить сортировку | Shift+Клик: добавить к сортировке" : "Клик: сортировать | Shift+Клик: добавить к сортировке"}
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
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 min-w-4 flex items-center justify-center font-semibold">
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
            cell: ({ getValue }: { getValue: () => any }) => {
              const value = getValue()
              // Get alignment for this data_in column
              const columnId = `data_in.${baseKey}`
              const alignment = columnAlignment?.[columnId] || 'left'
              const alignmentClass = alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left'
              return <div className={alignmentClass}>{value || '-'}</div>
            },
          }
        })
    })() : []),
  {
    id: "actions",
      cell: ({ row }) => (
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
            console.log('[DataTable] Using cached translations for locale:', locale, cachedTranslations?.dataTable)
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
        console.log('[DataTable] Translations loaded for locale:', locale, translationsData?.dataTable)
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
      }
    }
    return dataTableTranslations || defaultT
  }, [translations?.dataTable])

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
  
  React.useEffect(() => {
    console.log('[DataTable] Current translations:', { locale, hasTranslations: !!translations, dataTable: translations?.dataTable, t })
  }, [locale, translations, t])

  const primaryKey = React.useMemo(() => schema.find((c) => c.primary)?.name || "id", [schema])

  const fetchData = React.useCallback(async (abortSignal?: AbortSignal, isMountedRef?: { current: boolean }) => {
    setLoading(true)
    setError(null)
    try {
      // Check if search has operators - if yes, don't send to server (filter client-side)
      // Also need to load all data (no pagination limit) when filtering client-side
      const hasSearchOperators = searchConditions.some(c => c.operator)
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
      })

      const res = await fetch(`/api/admin/state?${queryParams}`, {
        signal: abortSignal,
        credentials: "include",
      })
      

      if (isMountedRef && !isMountedRef.current) return
      
      if (!res.ok) {
        throw new Error(`Failed to load: ${res.status}`)
      }
      const json: StateResponse = await res.json()
      

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
      
      const extendedColumns: ColumnSchemaExtended[] = json.schema.columns.map((col) => {
        const columnConfig = (collection as any)?.fields?.find((f: any) => f.name === col.name)
        const options = columnConfig?.options || {}
        
        // For taxonomy collection, get config from Taxonomy export
        let fieldConfig: any = null
        if (state.collection === 'taxonomy' && taxonomyConfig?.fields) {
          fieldConfig = taxonomyConfig.fields.find((f: any) => f.name === col.name)
        }
        
        // Hide system fields in table (data_in should be visible/editable via separate tab)
        const isSystemField = ['created_at', 'updated_at', 'deleted_at', 'uuid'].includes(col.name)
        
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
        } else if (columnConfig?.type === 'select' && columnConfig?.options?.length) {
          selectOptions = columnConfig.options.map((opt: any) => ({
            label: opt.label || opt.value,
            value: opt.value || opt,
          }))
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

        const dataTableFieldTitle =
          (translations as any)?.dataTable?.fields?.[state.collection]?.[col.name] as string | undefined
        if (dataTableFieldTitle) {
          fieldTitle = dataTableFieldTitle
        }
        
        // Capitalize first letter and replace underscores with spaces
        const defaultTitle = col.name.charAt(0).toUpperCase() + col.name.slice(1).replace(/_/g, ' ')
        
        const inferredDbFieldType = inferFieldTypeFromDbType((col as any).type)
        const forcedFieldType =
          col.name === "data_in"
            ? "json"
            : state.collection === "roles" && col.name === "title"
              ? "json"
              : undefined

        const forcedRelation: RelationConfig | undefined =
          col.name === "xaid"
            ? {
                collection: "expanses",
                valueField: "xaid",
                labelField: "title",
              }
            : undefined

        const isSystemFieldByName = ['created_at', 'updated_at', 'deleted_at', 'uuid'].includes(col.name)

        return {
          ...col,
          title: fieldTitle || options.title || columnConfig?.label || defaultTitle,
          hidden: options.hidden || false,
          hiddenTable: options.hiddenTable || isSystemFieldByName || col.name === 'data_in' || (state.collection === 'roles' && col.name === 'raid'), // Hide only core system fields, data_in, and raid for roles
          readOnly: options.readOnly || false,
          required: options.required || fieldConfig?.required || columnConfig?.required || false,
          virtual: options.virtual || false,
          fieldType:
            options.type ||
            fieldConfig?.type ||
            (columnConfig?.type === 'select' ? 'select' : columnConfig?.type) ||
            forcedFieldType ||
            inferredDbFieldType,
          textarea: options.textarea || false,
          enum: options.enum,
          relation: forcedRelation || options.relation,
          selectOptions,
        }
      })
      
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
              const label = col.relation!.labelFields
                ? col.relation!.labelFields.map(f => item[f]).filter(Boolean).join(" ")
                : String(item[col.relation!.labelField] || "-")
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
      
      // Update local state (preserve search from current state only if no operators)
      // hasSearchOperators already declared above
      const updateState = hasSearchOperators 
        ? { ...json.state, search: state.search } // Preserve search with operators
        : { ...json.state }
      setState((prev) => ({ ...prev, ...updateState }))
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

        setError((e as Error).message)
      }
    } finally {
      if (!isMountedRef || isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [state.collection, state.page, state.pageSize, state.search, JSON.stringify(state.filters), setState, taxonomyConfig, translations, searchConditions])

  React.useEffect(() => {
    const controller = new AbortController()
    const isMounted = { current: true }
    let fetchCompleted = false
    
    const fetchPromise = fetchData(controller.signal, isMounted)
      .then(() => {
        fetchCompleted = true
      })
      .catch((e) => {
        fetchCompleted = true
        // Silently ignore AbortError
        if (e?.name !== "AbortError" && isMounted.current) {
          console.error("Failed to fetch data:", e)
        }
      })
    
    return () => {
      isMounted.current = false
      // Don't call abort() - let requests complete naturally
      // Results will be ignored due to isMounted check
      // This prevents AbortError from being thrown

    }
  }, [fetchData])

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
  
  // Column alignment settings (left, center, right)
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
            setColumnVisibility(globalVisibility)
            return
          }
        }
        
        // Fallback to localStorage
        const saved = localStorage.getItem(`column-visibility-${state.collection}`)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && typeof parsed === 'object') {
            setColumnVisibility(parsed as VisibilityState)
            return
          }
        }
        
        // Default: all visible
        setColumnVisibility({})
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
      void fetchData()
    }
  }, [searchConditions, fetchData])
  
  // Default sorting state (stored in localStorage)
  const [defaultSorting, setDefaultSorting] = React.useState<SortingState>(() => {
    if (typeof window !== 'undefined' && state.collection) {
      try {
        const saved = localStorage.getItem(`default-sorting-${state.collection}`)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && Array.isArray(parsed)) {
            return parsed as SortingState
          }
        }
      } catch (e) {
        console.warn('Failed to restore default sorting from localStorage:', e)
      }
    }
    return []
  })
  
  const [sorting, setSorting] = React.useState<SortingState>(() => {
    // Initialize with default sorting if available
    if (typeof window !== 'undefined' && state.collection) {
      try {
        const saved = localStorage.getItem(`default-sorting-${state.collection}`)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && Array.isArray(parsed)) {
            return parsed as SortingState
          }
        }
      } catch (e) {
        // Ignore
      }
    }
    return []
  })
  
  // Restore default sorting when collection changes
  React.useEffect(() => {
    if (!state.collection || typeof window === 'undefined') return
    
    try {
      const saved = localStorage.getItem(`default-sorting-${state.collection}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && Array.isArray(parsed)) {
          setDefaultSorting(parsed as SortingState)
          setSorting(parsed as SortingState)
        } else {
          setDefaultSorting([])
          setSorting([])
        }
      } else {
        setDefaultSorting([])
        setSorting([])
      }
    } catch (e) {
      console.warn('Failed to restore default sorting:', e)
      setDefaultSorting([])
      setSorting([])
    }
  }, [state.collection])
  
  // Save default sorting to localStorage when it changes
  React.useEffect(() => {
    if (state.collection && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`default-sorting-${state.collection}`, JSON.stringify(defaultSorting))
      } catch (e) {
        console.warn('Failed to save default sorting to localStorage:', e)
      }
    }
  }, [defaultSorting, state.collection])
  
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
    () => schema.filter((col) => !isAutoGeneratedField(col.name, !!col.relation) && !col.primary && !col.hidden),
    [schema, isAutoGeneratedField]
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
    setEditData((prev) => ({ ...prev, [fieldName]: value }))
  }, [])

  // Create dialog keep after
  // Generate columns dynamically
  const columns = React.useMemo(
    () => (schema.length > 0 ? generateColumns(schema, onDeleteRequest, onEditRequest, onDuplicateRequest, locale, relationData, t, state.collection, data, columnVisibility, columnAlignment) : []),
    [schema, onDeleteRequest, onEditRequest, onDuplicateRequest, locale, relationData, t, state.collection, data, columnVisibility, columnAlignment]
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
    if (!needsClientSideFilter || !parsedSearchQuery) {
      return data
    }

    // Has operators - filter client-side
    const filtered = data.filter((row) => {
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
  }, [data, parsedSearchQuery, needsClientSideFilter, total, pagination.pageSize])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    pageCount: totalPages,
    manualPagination: true,
    enableRowSelection: true,
    enableMultiSort: true, // Enable multi-column sorting
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
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

        if (field?.fieldType === 'json' && value != null && typeof value === 'object' && !(value instanceof Date)) {
          acc[key] = value // Keep as object, server will stringify
        } else if (field?.fieldType === 'price') {
          if (value != null && typeof value === 'number') {
            acc[key] = value
          } else if (value === null && field.nullable) {
            acc[key] = null
          }
        } else if (value instanceof Date) {
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

        if (field?.fieldType === 'json' && value != null && typeof value === 'object' && !(value instanceof Date)) {
          acc[key] = value // Keep as object, server will stringify
        } else if (field?.fieldType === 'price') {
          if (value != null && typeof value === 'number') {
            acc[key] = value
          } else if (value === null && field.nullable) {
            acc[key] = null
          }
        } else if (value instanceof Date) {
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
        } else if (value instanceof Date) {
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
    
    // Get column order from table (as user sees it)
    const columnOrder = table.getAllColumns()
      .map(col => col.id)
      .filter(id => id !== 'select')
    
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
  }, [table, state.collection, schema, columnVisibility, locale, relationData])

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

  return (
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        {/* Search Field */}
        <div className="relative w-full max-w-sm">
          <div className="relative flex items-center gap-1 min-h-9 rounded-md border bg-primary-foreground px-3 py-1 shadow-xs">
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
                placeholder={searchConditions.length === 0 ? (t.search + ' (Enter для добавления, "фраза" для точного поиска, AND/OR для операторов)') : ''}
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
                className="border-0 p-0 h-auto flex-1 min-w-[120px] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none bg-transparent"
              />
            </div>
          </div>
        </div>
        
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <div className="flex items-center gap-2">
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => setBatchDeleteOpen(true)}
              disabled={batchDeleting}
            >
              <IconTrash />
              <span className="hidden lg:inline">{t.delete?.selected || "Delete Selected"}</span>
              <span className="lg:hidden">{t.delete?.delete || "Delete"}</span>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-primary-foreground">
                <IconDownload />
                <span className="hidden lg:inline">Экспорт</span>
                <IconChevronDown />
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
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-primary-foreground">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Настроить таблицу</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 max-h-[400px] overflow-y-auto">
              {/* Schema fields */}
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide() &&
                    column.id !== 'suffix' // suffix will be handled separately
                )
                .map((column) => {
                  // Find column schema to get translated title
                  const columnSchema = schema.find((col) => col.name === column.id)
                  const columnTitle = columnSchema?.title || column.id
                  const canSort = column.getCanSort()
                  const defaultSortForColumn = defaultSorting.find(s => s.id === column.id)
                  const sortValue = defaultSortForColumn ? (defaultSortForColumn.desc ? 'desc' : 'asc') : 'none'
                  
                  return (
                    <DropdownMenuSub key={column.id}>
                      <DropdownMenuSubTrigger>
                        <div className="flex items-center justify-between w-full">
                          <span>{columnTitle}</span>
                          <div className="flex items-center gap-1 ml-2">
                            {column.getIsVisible() && (
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
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                          Показать колонку
                    </DropdownMenuCheckboxItem>
                        {canSort && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Сортировка по умолчанию</DropdownMenuLabel>
                            <DropdownMenuRadioGroup
                              value={sortValue}
                              onValueChange={(value) => {
                                if (value === 'none') {
                                  // Remove from default sorting
                                  const newDefaultSorting = defaultSorting.filter(s => s.id !== column.id)
                                  setDefaultSorting(newDefaultSorting)
                                  // Also update current sorting if it matches
                                  if (sorting.find(s => s.id === column.id)) {
                                    const newSorting = sorting.filter(s => s.id !== column.id)
                                    setSorting(newSorting)
                                  }
                                } else {
                                  // Add or update default sorting
                                  const newSort = { id: column.id, desc: value === 'desc' }
                                  const newDefaultSorting = defaultSorting.filter(s => s.id !== column.id)
                                  newDefaultSorting.push(newSort)
                                  setDefaultSorting(newDefaultSorting)
                                  // Also update current sorting
                                  const newSorting = sorting.filter(s => s.id !== column.id)
                                  newSorting.push(newSort)
                                  setSorting(newSorting)
                                }
                              }}
                            >
                              <DropdownMenuRadioItem value="none">
                                <IconArrowsSort className="h-4 w-4 mr-2" />
                                Нет
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="asc">
                                <IconArrowUp className="h-4 w-4 mr-2" />
                                A-Z
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="desc">
                                <IconArrowDown className="h-4 w-4 mr-2" />
                                Z-A
                              </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Выравнивание</DropdownMenuLabel>
                        <DropdownMenuRadioGroup
                          value={columnAlignment[column.id] || 'left'}
                          onValueChange={(value) => {
                            setColumnAlignment(prev => ({
                              ...prev,
                              [column.id]: value as 'left' | 'center' | 'right'
                            }))
                          }}
                        >
                          <DropdownMenuRadioItem value="left">
                            <IconAlignLeft className="h-4 w-4 mr-2" />
                            Слева
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="center">
                            <IconAlignCenter className="h-4 w-4 mr-2" />
                            По центру
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="right">
                            <IconAlignRight className="h-4 w-4 mr-2" />
                            Справа
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  )
                })}
              {/* Data_in fields */}
              {(() => {
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
                          if (langMatch && supportedLanguageCodes.includes(langMatch[2].toLowerCase() as LanguageCode)) {
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
                
                // Exclude 'suffix' for roles (will be added separately) and 'main' (system field)
                const filteredKeys = Array.from(allDataInKeys).filter((baseKey) => {
                  const lowerKey = baseKey.toLowerCase()
                  // Exclude suffix for roles (will be added separately in this section)
                  if (state.collection === 'roles' && lowerKey === 'suffix') {
                    return false
                  }
                  // Exclude main (system field)
                  if (lowerKey === 'main') {
                    return false
                  }
                  return true
                }).sort()
                
                // For roles collection, add suffix to the list (it's a virtual column but should appear in data_in section)
                if (state.collection === 'roles') {
                  filteredKeys.push('suffix')
                }
                
                if (filteredKeys.length === 0) {
                  return null
                }
                
                return (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {(t as any)?.dataTable?.dataInFields || "Поля из data_in"}
                    </div>
                    {filteredKeys.map((baseKey) => {
                      // For suffix in roles, use virtual column id 'suffix', otherwise use data_in.baseKey
                      const isSuffix = state.collection === 'roles' && baseKey.toLowerCase() === 'suffix'
                      const columnId = isSuffix ? 'suffix' : `data_in.${baseKey}`
                      const suffixColumn = isSuffix ? table.getAllColumns().find(col => col.id === 'suffix') : null
                      const isVisible = isSuffix 
                        ? (suffixColumn?.getIsVisible() ?? false)
                        : (columnVisibility[columnId] !== false)
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
                      const fieldTranslation = (t as any)?.dataTable?.fields?.[state.collection]?.[baseKey]
                      const columnTitle = fieldTitle || fieldTranslation || baseKey
                      const dataInColumn = isSuffix ? suffixColumn : table.getAllColumns().find(col => col.id === columnId)
                      const canSort = dataInColumn?.getCanSort() ?? false
                      const defaultSortForColumn = defaultSorting.find(s => s.id === columnId)
                      const sortValue = defaultSortForColumn ? (defaultSortForColumn.desc ? 'desc' : 'asc') : 'none'
                      
                      return (
                        <DropdownMenuSub key={columnId}>
                          <DropdownMenuSubTrigger>
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
                                if (isSuffix && suffixColumn) {
                                  // For suffix, use table column visibility
                                  suffixColumn.toggleVisibility(!!value)
                                } else {
                                  setColumnVisibility((prev) => ({
                                    ...prev,
                                    [columnId]: !!value
                                  }))
                                }
                              }}
                            >
                              Показать колонку
                            </DropdownMenuCheckboxItem>
                            {canSort && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Сортировка по умолчанию</DropdownMenuLabel>
                                <DropdownMenuRadioGroup
                                  value={sortValue}
                                  onValueChange={(value) => {
                                    if (value === 'none') {
                                      const newDefaultSorting = defaultSorting.filter(s => s.id !== columnId)
                                      setDefaultSorting(newDefaultSorting)
                                      if (sorting.find(s => s.id === columnId)) {
                                        const newSorting = sorting.filter(s => s.id !== columnId)
                                        setSorting(newSorting)
                                      }
                                    } else {
                                      const newSort = { id: columnId, desc: value === 'desc' }
                                      const newDefaultSorting = defaultSorting.filter(s => s.id !== columnId)
                                      newDefaultSorting.push(newSort)
                                      setDefaultSorting(newDefaultSorting)
                                      const newSorting = sorting.filter(s => s.id !== columnId)
                                      newSorting.push(newSort)
                                      setSorting(newSorting)
                                    }
                                  }}
                                >
                                  <DropdownMenuRadioItem value="none">
                                    <IconArrowsSort className="h-4 w-4 mr-2" />
                                    Нет
                                  </DropdownMenuRadioItem>
                                  <DropdownMenuRadioItem value="asc">
                                    <IconArrowUp className="h-4 w-4 mr-2" />
                                    A-Z
                                  </DropdownMenuRadioItem>
                                  <DropdownMenuRadioItem value="desc">
                                    <IconArrowDown className="h-4 w-4 mr-2" />
                                    Z-A
                                  </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Выравнивание</DropdownMenuLabel>
                            <DropdownMenuRadioGroup
                              value={columnAlignment[isSuffix ? 'suffix' : columnId] || 'left'}
                              onValueChange={(value) => {
                                setColumnAlignment(prev => ({
                                  ...prev,
                                  [isSuffix ? 'suffix' : columnId]: value as 'left' | 'center' | 'right'
                                }))
                              }}
                            >
                              <DropdownMenuRadioItem value="left">
                                <IconAlignLeft className="h-4 w-4 mr-2" />
                                Слева
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="center">
                                <IconAlignCenter className="h-4 w-4 mr-2" />
                                По центру
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="right">
                                <IconAlignRight className="h-4 w-4 mr-2" />
                                Справа
                              </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      )
                    })}
                  </>
                )
              })()}
              {/* Page size setting */}
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <div className="flex items-center justify-between w-full">
                    <span>Строк на странице</span>
                    <span className="text-muted-foreground text-sm ml-2">{defaultPageSize}</span>
                  </div>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuLabel>Строк на странице</DropdownMenuLabel>
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
              {/* Show/hide filter row */}
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={showFilterRow}
                onCheckedChange={(value) => setShowFilterRow(!!value)}
                className="justify-end"
              >
                <IconFilter className="h-4 w-4 mr-2" />
                {(t as any)?.dataTable?.showFilters || "Показать фильтры"}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" className="bg-primary-foreground" onClick={() => setCreateOpen(true)}>
            <IconPlus />
            <span className="hidden lg:inline">{t.add}</span>
          </Button>
        </div>
      </div>
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        {loading && (
          <div className="flex items-center justify-center py-8">
            <IconLoader className="size-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              {t.loading ? t.loading.replace("{collection}", collectionLabel) : `Loading ${collectionLabel}...`}
            </span>
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            Error: {error}
          </div>
        )}
        {!loading && !error && (
          <>
        <div className="overflow-hidden rounded-lg border bg-primary-foreground">
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              {/* Filter row - show filter inputs under headers */}
              {showFilterRow && table.getHeaderGroups().length > 0 && (
                <thead className="bg-muted/50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={`filter-${headerGroup.id}`}>
                      {headerGroup.headers.map((header) => {
                        const columnId = header.column.id
                        
                        // Skip filter for row selection column
                        if (columnId === 'select') {
                          return (
                            <TableHead key={`filter-${header.id}`} className="p-1">
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
                        
                        // Determine if this is a multiselect field
                        const isMultiselect = colSchema && (
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
                        
                        // Get current filter value (array for multiselect, string for text)
                        const currentFilterValue = columnFilterValues[columnId]
                        const multiselectValue = isMultiselect 
                          ? (Array.isArray(currentFilterValue) ? currentFilterValue : [])
                          : []
                        const textValue = !isMultiselect 
                          ? (typeof currentFilterValue === 'string' ? currentFilterValue : '')
                          : ''
                        
                        return (
                          <TableHead key={`filter-${header.id}`} className="p-1">
                            {header.isPlaceholder ? null : (
                              <div className="flex items-center justify-center">
                                {isMultiselect && multiselectOptions.length > 0 ? (
                                  <ColumnFilterMultiselect
                                    options={multiselectOptions}
                                    value={multiselectValue}
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
                                    placeholder="Фильтр..."
                                  />
                                ) : (
                                  <Input
                                    placeholder="Фильтр..."
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
                                    className="h-7 text-xs"
                                    size={1}
                                  />
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
                {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        onDoubleClick={() => onEditRequest(row)}
                        className="cursor-pointer bg-primary-foreground"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
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
        <div className="flex items-center justify-between px-4">
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
        <ResponsiveDialogContent className="p-5">
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
        <ResponsiveDialogContent className="p-5">
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
            <div className="border-b px-5 py-4">
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>{t.addRecord.title.replace("{collection}", collectionLabel)}</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>
                  {t.addRecord.description}
                </ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
            </div>
            <form onSubmit={handleCreateSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                <Tabs value={createFormTab} onValueChange={(v) => setCreateFormTab(v as any)} className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="main">Основное</TabsTrigger>
                    {state.collection === 'roles' && <TabsTrigger value="info">Информация</TabsTrigger>}
                    <TabsTrigger value="details">Подробнее</TabsTrigger>
                  </TabsList>
                  <TabsContent value="main" className="mt-0">
                    <div className="grid gap-4">
                      {editableFields.filter((f) => {
                        if (f.name === "data_in") return false
                        if (state.collection === 'roles') {
                          // For roles, show: title, name, description, is_system, xaid
                          return ['title', 'name', 'description', 'is_system', 'xaid'].includes(f.name)
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
                      {field.title || field.name}
                    </Label>
                  </div>
                ) : field.fieldType === 'date' || field.fieldType === 'time' || field.fieldType === 'datetime' ? (
                  <>
                    <Label htmlFor={`field-${field.name}`} className="text-sm font-medium">
                      {field.title || field.name}
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
                      {field.title || field.name}
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
                      {field.title || field.name}
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
                        {field.title || field.name}
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
                      {field.title || field.name}
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
                ) : field.fieldType === 'select' && field.selectOptions ? (
                  <>
                    <Label htmlFor={`field-${field.name}`} className="text-sm font-medium">
                      {field.title || field.name}
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
                      {field.title || field.name}
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
                      <SelectContent className="max-h-[300px] z-[9999]" position="popper" sideOffset={5}>
                        {field.enum.values.map((val, index) => (
                          <SelectItem key={val} value={val}>
                            {field.enum!.labels[index] || val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                ) : field.relation ? (
                  <>
                    <Label htmlFor={`field-${field.name}`} className="text-sm font-medium">
                      {field.title || field.name}
                      {!field.nullable && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <RelationSelect
                      relation={field.relation}
                      value={formData[field.name]}
                      onChange={(value) => handleFieldChange(field.name, value)}
                      required={!field.nullable}
                      translations={t}
                      search={state.search}
                    />
                  </>
                ) : field.textarea ? (
                  <>
                    <Label htmlFor={`field-${field.name}`} className="text-sm font-medium">
                      {field.title || field.name}
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
                      {field.title || field.name}
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
                ) : (
                  <>
                    <Label htmlFor={`field-${field.name}`} className="text-sm font-medium">
                      {field.title || field.name}
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
                                {field.title || field.name}
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
                        <div className="text-sm font-medium">Язык для редактирования</div>
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
                          Добавить поле
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
                                  placeholder="Value (string или JSON)"
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
                            Copy
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
                            Применить JSON
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
              <div className="border-t px-5 py-4">
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
            <div className="border-b px-5 py-4">
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
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                <Tabs value={editFormTab} onValueChange={(v) => setEditFormTab(v as any)} className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="main">Основное</TabsTrigger>
                    {state.collection === 'roles' && <TabsTrigger value="info">Информация</TabsTrigger>}
                    <TabsTrigger value="details">Подробнее</TabsTrigger>
                  </TabsList>
                  <TabsContent value="main" className="mt-0">
                    <div className="grid gap-4">
                      {schema.filter((f) => {
                        if (!isAutoGeneratedField(f.name, !!f.relation) && !f.primary && !f.hidden && f.name !== "data_in") {
                          if (state.collection === 'roles') {
                            // For roles, show: title, name, description, is_system, xaid
                            return ['title', 'name', 'description', 'is_system', 'xaid'].includes(f.name)
                          }
                          return true
                        }
                        return false
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
                      {field.title || field.name}
                    </Label>
                  </div>
                ) : field.fieldType === 'date' || field.fieldType === 'time' || field.fieldType === 'datetime' ? (
                  <>
                    <Label htmlFor={`edit-field-${field.name}`} className="text-sm font-medium">
                      {field.title || field.name}
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
                      {field.title || field.name}
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
                        {field.title || field.name}
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
                      {field.title || field.name}
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
                ) : field.fieldType === 'select' && field.selectOptions ? (
                  <>
                    <Label htmlFor={`edit-field-${field.name}`} className="text-sm font-medium">
                      {field.title || field.name}
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
                ) : field.relation ? (
                  <>
                    <Label htmlFor={`edit-field-${field.name}`} className="text-sm font-medium">
                      {field.title || field.name}
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
                    />
                  </>
                ) : field.textarea ? (
                  <>
                    <Label htmlFor={`edit-field-${field.name}`} className="text-sm font-medium">
                      {field.title || field.name}
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
                      {field.title || field.name}
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
                ) : (
                  <>
                    <Label htmlFor={`edit-field-${field.name}`} className="text-sm font-medium">
                      {field.title || field.name}
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
                                {field.title || field.name}
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
                        <div className="text-sm font-medium">Язык для редактирования</div>
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
                          Добавить поле
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
                                  placeholder="Value (string или JSON)"
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
                            Copy
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
                            Применить JSON
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
              <div className="border-t px-5 py-4">
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
                          title="Предыдущая запись"
                        >
                          <IconChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={navigateToNext}
                          disabled={!hasNextRecord}
                          title="Следующая запись"
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
            <ResponsiveDialogTitle>Экспорт данных</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Экспортировано {table.getFilteredRowModel().rows.length} записей в формате {exportFormat.toUpperCase()}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="flex-1 overflow-auto min-h-0 px-6 pb-4">
            <Textarea
              value={exportData}
              readOnly
              className="font-mono text-sm min-h-[300px] resize-none w-full"
              style={{ whiteSpace: exportFormat === 'json' ? 'pre' : 'pre-wrap' }}
            />
          </div>
          <ResponsiveDialogFooter className="flex-shrink-0 px-6 py-4">
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              Закрыть
            </Button>
            <Button variant="outline" onClick={handleExportCopy}>
              <IconCopy className="mr-2 h-4 w-4" />
              {exportCopied ? 'Скопировано!' : 'Копировать'}
            </Button>
            <Button onClick={handleExportDownload}>
              <IconDownload className="mr-2 h-4 w-4" />
              Скачать файл
            </Button>
          </ResponsiveDialogFooter>
          <ResponsiveDialogClose className="sr-only" />
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </Tabs>
  )
}

