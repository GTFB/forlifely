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
} from "@tabler/icons-react"
import { getCollection } from "../../../functions/_shared/collections/getCollection"
import type { AdminFilter } from "../../../functions/_shared/types"
import { useLocale } from "@/packages/hooks/use-locale"
import { DateTimePicker } from "@/packages/components/ui/date-time-picker"
import { PhoneInput } from "@/packages/components/ui/phone-input"
import qs from "qs"
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
} from "@/components/ui/dropdown-menu"
import { Input } from "@/packages/components/ui/input"
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

// Relation Select Component
function RelationSelect({
  relation,
  value,
  onChange,
  disabled,
  required,
<<<<<<< HEAD
  translations,
=======
  search,
>>>>>>> 204496219e9b854a27930a418936c21a3b6098e4
}: {
  relation: RelationConfig
  value: any
  onChange: (value: any) => void
  disabled?: boolean
  required?: boolean
<<<<<<< HEAD
  translations?: any
=======
  search?: string
>>>>>>> 204496219e9b854a27930a418936c21a3b6098e4
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
function generateColumns(schema: ColumnSchemaExtended[], onDeleteRequest: (row: Row<CollectionData>) => void, onEditRequest: (row: Row<CollectionData>) => void, locale: string = 'en', relationData: Record<string, Record<any, string>> = {}, translations?: any, collection?: string): ColumnDef<CollectionData>[] {
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
        return (
          <Button
            variant="ghost"
            className="h-auto p-0 hover:bg-transparent font-semibold"
            onClick={(e) => {
              if (e.shiftKey) {
                // Shift + click: add to multi-sort
                column.toggleSorting(isSorted === "asc", true)
              } else {
                // Regular click: toggle sort (replaces existing sorts)
                column.toggleSorting(isSorted === "asc")
              }
            }}
          >
            <div className="flex items-center gap-1">
              <span>{col.title || col.name}</span>
              {col.primary && (
                <Badge variant="outline" className="text-[10px] px-1 py-0">
                  PK
                </Badge>
              )}
              {column.getCanSort() && isSorted && (
                <span className="ml-1 flex items-center gap-0.5">
                  {isSorted === "asc" ? (
                    <>
                      <IconArrowUp className="h-3 w-3" />
                      {sortedIndex >= 0 && table.getState().sorting.length > 1 && (
                        <span className="text-[10px] text-muted-foreground">{sortedIndex + 1}</span>
                      )}
                    </>
                  ) : (
                    <>
                      <IconArrowDown className="h-3 w-3" />
                      {sortedIndex >= 0 && table.getState().sorting.length > 1 && (
                        <span className="text-[10px] text-muted-foreground">{sortedIndex + 1}</span>
                      )}
                    </>
                  )}
                </span>
              )}
            </div>
          </Button>
        )
      },
      cell: ({ row }: { row: Row<CollectionData> }) => {
        const value = row.original[col.name]
        
        // For boolean type, show checkbox-like display
        if (col.fieldType === 'boolean') {
          const boolValue = value === 1 || value === true || value === '1' || value === 'true'
          return (
            <div className="flex items-center justify-center">
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
          return <div className={`${col.primary ? "font-mono font-medium" : "font-mono"}`}>{amount}</div>
        }

        // For enum type, show label instead of value
        if (col.fieldType === 'enum' && col.enum) {
          const valueIndex = col.enum.values.indexOf(String(value))
          const label = valueIndex >= 0 ? col.enum.labels[valueIndex] : value || "-"
          return <div>{label}</div>
        }

        // For relation fields, show label instead of value
        if (col.relation && relationData[col.name]) {
          const label = relationData[col.name][value] || value || "-"
          return <div>{label}</div>
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
          return <div>{displayValue}</div>
        }
        
        // For JSON fields in taxonomy collection (title and category fields), extract translation by locale
        if (col.fieldType === 'json' && collection === 'taxonomy' && (col.name === 'title' || col.name === 'category')) {
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
            const localizedValue = jsonValue[locale] || jsonValue.en || jsonValue.ru || value || "-"
            return <div>{localizedValue}</div>
          }
        }
        
        // Use defaultCell if value is empty/null/undefined
        const isEmpty = value === null || value === undefined || value === ''
        const displayValue = isEmpty && col.defaultCell !== undefined
          ? col.defaultCell
          : col.format 
            ? col.format(value, locale) 
            : formatCellValue(value)
        
        return (
          <div className={`${col.primary ? "font-mono font-medium" : ""}`}>
            {displayValue}
          </div>
        )
      },
    })),
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
            <DropdownMenuItem>{translations?.actions?.view || "View"}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditRequest(row)}>{translations?.actions?.edit || "Edit"}</DropdownMenuItem>
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
  const [locale, setLocale] = React.useState<'en' | 'ru'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-locale')
      if (saved === 'en' || saved === 'ru') {
        return saved
      }
    }
    return 'ru'
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
  
  // Local state for price inputs to allow free input without formatting interference
  const [priceInputs, setPriceInputs] = React.useState<Record<string, string>>({})

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
      if (newLocale === 'en' || newLocale === 'ru') {
        setLocale(newLocale)
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
  }, [])

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
          const translationsModule = locale === 'ru'
            ? await import("@/packages/content/locales/ru.json")
            : await import("@/packages/content/locales/en.json")
          setTranslations(translationsModule.default || translationsModule)
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
  
  React.useEffect(() => {
    console.log('[DataTable] Current translations:', { locale, hasTranslations: !!translations, dataTable: translations?.dataTable, t })
  }, [locale, translations, t])

  const primaryKey = React.useMemo(() => schema.find((c) => c.primary)?.name || "id", [schema])

  const fetchData = React.useCallback(async (abortSignal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = qs.stringify({
        c: state.collection,
        p: state.page,
        ps: state.pageSize,
        ...(state.search && { s: state.search }),
        ...(state.filters.length > 0 && { filters: state.filters }),
      })

      const res = await fetch(`/api/admin/state?${queryParams}`, {
        signal: abortSignal,
        credentials: "include",
      })
      if (!res.ok) {
        throw new Error(`Failed to load: ${res.status}`)
      }
      const json: StateResponse = await res.json()
      
      // Get collection config and apply column settings
      const collection = getCollection(state.collection)
      
      const extendedColumns: ColumnSchemaExtended[] = json.schema.columns.map((col) => {
        const columnConfig = (collection as any)?.fields?.find((f: any) => f.name === col.name)
        const options = columnConfig?.options || {}
        
        // For taxonomy collection, get config from Taxonomy export
        let fieldConfig: any = null
        if (state.collection === 'taxonomy' && taxonomyConfig?.fields) {
          fieldConfig = taxonomyConfig.fields.find((f: any) => f.name === col.name)
        }
        
        // Hide system fields (created_at, updated_at, deleted_at, uuid, data_in)
        const isSystemField = ['created_at', 'updated_at', 'deleted_at', 'uuid', 'data_in'].includes(col.name)
        
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
        
        // Capitalize first letter and replace underscores with spaces
        const defaultTitle = col.name.charAt(0).toUpperCase() + col.name.slice(1).replace(/_/g, ' ')
        
        return {
          ...col,
          title: fieldTitle || options.title || columnConfig?.label || defaultTitle,
          hidden: options.hidden || false,
          hiddenTable: options.hiddenTable || isSystemField, // Hide system fields
          readOnly: options.readOnly || false,
          required: options.required || fieldConfig?.required || columnConfig?.required || false,
          virtual: options.virtual || false,
          defaultCell: options.defaultCell,
          format: options.format,
<<<<<<< HEAD
          fieldType: options.type || fieldConfig?.type || (columnConfig?.type === 'select' ? 'select' : columnConfig?.type),
=======
          fieldType: options.type,
          enum: options.enum,
>>>>>>> 204496219e9b854a27930a418936c21a3b6098e4
          relation: options.relation,
          selectOptions,
        }
      })
      
      // Load relation data for display
      const relationsToLoad = extendedColumns.filter(col => col.relation)
      const relationDataMap: Record<string, Record<any, string>> = {}
      
      for (const col of relationsToLoad) {
        if (!col.relation) continue
        
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
            credentials: "include",
          })
          
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
          console.error(`Failed to load relation data for ${col.name}:`, e)
        }
      }
      
      setRelationData(relationDataMap)
      
      // Update local state (preserve search from current state)
      setState((prev) => ({ ...prev, ...json.state }))
      setSchema(extendedColumns)
      setTotal(json.schema.total)
      setTotalPages(json.schema.totalPages)
      setData(json.data)
    } catch (e) {
      if ((e as any).name !== "AbortError") {
        setError((e as Error).message)
      }
    } finally {
      setLoading(false)
    }
  }, [state.collection, state.page, state.pageSize, state.search, JSON.stringify(state.filters), setState, taxonomyConfig, translations])

  React.useEffect(() => {
    const controller = new AbortController()
    fetchData(controller.signal)
    return () => controller.abort()
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

  // pagination sync with admin state
  const [pagination, setPagination] = React.useState({
    pageIndex: Math.max(0, state.page - 1),
    pageSize: state.pageSize,
  })

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
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])

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

  // Create dialog state
  const [createOpen, setCreateOpen] = React.useState(false)
  const [formData, setFormData] = React.useState<Record<string, any>>({})
  const [createError, setCreateError] = React.useState<string | null>(null)
  // Language selector for JSON fields (title, category)
  const [jsonFieldLanguage, setJsonFieldLanguage] = React.useState<Record<string, 'en' | 'ru'>>({})

  // Clear form data when collection changes
  React.useEffect(() => {
    setFormData({})
    setCreateError(null)
<<<<<<< HEAD
    setJsonFieldLanguage({}) // Reset language selectors
=======
    setPriceInputs({})
>>>>>>> 204496219e9b854a27930a418936c21a3b6098e4
  }, [state.collection])

  // Fields to skip (auto-generated): id, uuid, {x}aid (but not relation fields), created_at, updated_at, deleted_at, data_in
  const isAutoGeneratedField = React.useCallback((fieldName: string, hasRelation?: boolean): boolean => {
    const lower = fieldName.toLowerCase()
    return (
      lower === 'id' ||
      lower === 'uuid' ||
      (lower.endsWith('aid') && !hasRelation) || // Skip aid fields unless they have relations
      lower === 'created_at' ||
      lower === 'updated_at' ||
      lower === 'deleted_at' ||
      lower === 'data_in'
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

  // Clear edit data when collection changes
  React.useEffect(() => {
    setEditData({})
    setEditError(null)
    setRecordToEdit(null)
<<<<<<< HEAD
    setJsonFieldLanguage({}) // Reset language selectors
=======
    setPriceInputs({})
>>>>>>> 204496219e9b854a27930a418936c21a3b6098e4
  }, [state.collection])

  const onEditRequest = React.useCallback((row: Row<CollectionData>) => {
    const record = row.original
    setRecordToEdit(record)
    const initial: Record<string, any> = {}
    for (const col of schema) {
      if (!isAutoGeneratedField(col.name, !!col.relation) && !col.primary) {
        if (col.fieldType === 'boolean') {
          initial[col.name] = record[col.name] === 1 || record[col.name] === true || record[col.name] === '1' || record[col.name] === 'true'
        } else if (col.fieldType === 'date' || col.fieldType === 'time' || col.fieldType === 'datetime') {
          initial[col.name] = record[col.name] ? new Date(record[col.name]) : null
<<<<<<< HEAD
        } else if (col.fieldType === 'json' && state.collection === 'taxonomy' && (col.name === 'title' || col.name === 'category')) {
          // For title and category JSON fields, parse and extract en/ru values
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
              jsonValue = { en: jsonValue || '', ru: jsonValue || '' }
            }
          }
          if (!jsonValue || typeof jsonValue !== 'object') {
            jsonValue = { en: '', ru: '' }
          }
          initial[`${col.name}_en`] = jsonValue.en || ''
          initial[`${col.name}_ru`] = jsonValue.ru || ''
          // Initialize language selector to current locale
          setJsonFieldLanguage(prev => ({ ...prev, [col.name]: locale as 'en' | 'ru' }))
=======
        } else if (col.fieldType === 'price') {
          const cents = record[col.name]
          initial[col.name] = cents == null ? null : Number(cents)
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
>>>>>>> 204496219e9b854a27930a418936c21a3b6098e4
        } else {
          initial[col.name] = record[col.name] != null ? String(record[col.name]) : ''
        }
      }
    }
    setEditData(initial)
    setEditOpen(true)
  }, [schema, isAutoGeneratedField, state.collection, locale])

  const handleEditFieldChange = React.useCallback((fieldName: string, value: string | boolean | Date | number | null) => {
    setEditData((prev) => ({ ...prev, [fieldName]: value }))
  }, [])

  // Create dialog keep after
  // Generate columns dynamically
  const columns = React.useMemo(
    () => (schema.length > 0 ? generateColumns(schema, onDeleteRequest, onEditRequest, locale, relationData, t, state.collection) : []),
    [schema, onDeleteRequest, onEditRequest, locale, relationData, t, state.collection]
  )

  const table = useReactTable({
    data,
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
<<<<<<< HEAD
      // Convert Date objects to ISO strings for API and handle JSON fields
      const payload = Object.entries(formData).reduce((acc, [key, value]) => {
        // Handle title_en/title_ru and category_en/category_ru for taxonomy collection
        if (state.collection === 'taxonomy' && (key === 'title_en' || key === 'title_ru' || key === 'category_en' || key === 'category_ru')) {
          const fieldName = key.replace(/_en$/, '').replace(/_ru$/, '')
          if (!acc[fieldName]) {
            acc[fieldName] = { en: '', ru: '' }
          }
          if (key.endsWith('_en')) {
            acc[fieldName].en = value || ''
          } else {
            acc[fieldName].ru = value || ''
          }
        } else if (!key.match(/_(en|ru)$/)) {
          // Skip title_en/title_ru/category_en/category_ru as they're already processed above
          acc[key] = value instanceof Date ? value.toISOString() : value
=======
      // Convert Date objects to ISO strings and serialize JSON fields for API
      const payload = Object.entries(formData).reduce((acc, [key, value]) => {
        const field = schema.find(f => f.name === key)
        if (field?.fieldType === 'json' && value != null && typeof value === 'object') {
          acc[key] = value // Keep as object, server will stringify
        } else if (field?.fieldType === 'price') {
          // For price fields, include value if it's a number, or null if nullable
          // Price is stored as integer cents in DB
          if (value != null && typeof value === 'number') {
            acc[key] = value
          } else if (value === null && field.nullable) {
            acc[key] = null
          }
          // If null/undefined and not nullable, skip (validation should catch this)
        } else if (value instanceof Date) {
          acc[key] = value.toISOString()
        } else {
          acc[key] = value
>>>>>>> 204496219e9b854a27930a418936c21a3b6098e4
        }
        return acc
      }, {} as Record<string, any>)
      
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
    setEditError(null)
    try {
<<<<<<< HEAD
      // Convert Date objects to ISO strings for API and handle JSON fields
      const payload = Object.entries(editData).reduce((acc, [key, value]) => {
        // Handle title_en/title_ru and category_en/category_ru for taxonomy collection
        if (state.collection === 'taxonomy' && (key === 'title_en' || key === 'title_ru' || key === 'category_en' || key === 'category_ru')) {
          const fieldName = key.replace(/_en$/, '').replace(/_ru$/, '')
          if (!acc[fieldName]) {
            acc[fieldName] = { en: '', ru: '' }
          }
          if (key.endsWith('_en')) {
            acc[fieldName].en = value || ''
          } else {
            acc[fieldName].ru = value || ''
          }
        } else if (!key.match(/_(en|ru)$/)) {
          // Skip title_en/title_ru/category_en/category_ru as they're already processed above
          acc[key] = value instanceof Date ? value.toISOString() : value
=======
      // Convert Date objects to ISO strings and keep JSON fields as objects for API
      const payload = Object.entries(editData).reduce((acc, [key, value]) => {
        const field = schema.find(f => f.name === key)
        if (field?.fieldType === 'json' && value != null && typeof value === 'object') {
          acc[key] = value // Keep as object, server will stringify
        } else if (field?.fieldType === 'price') {
          // For price fields, include value if it's a number, or null if nullable
          // Price is stored as integer cents in DB
          if (value != null && typeof value === 'number') {
            acc[key] = value
          } else if (value === null && field.nullable) {
            acc[key] = null
          }
          // If null/undefined and not nullable, skip (validation should catch this)
        } else if (value instanceof Date) {
          acc[key] = value.toISOString()
        } else {
          acc[key] = value
>>>>>>> 204496219e9b854a27930a418936c21a3b6098e4
        }
        return acc
      }, {} as Record<string, any>)
      
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

  return (
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        {/* Search Field */}
        <div className="relative w-full max-w-sm">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t.search}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
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
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">{t.customizeColumns}</span>
                <span className="lg:hidden">{t.columns}</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
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
            <span className="ml-2 text-sm text-muted-foreground">Loading {state.collection}...</span>
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            Error: {error}
          </div>
        )}
        {!loading && !error && (
          <>
        <div className="overflow-hidden rounded-lg border">
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
                <TableBody>
                {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        onDoubleClick={() => onEditRequest(row)}
                        className="cursor-pointer"
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
                        {t.noDataFound.replace('{collection}', state.collection)}
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
                  table.setPageSize(Number(value))
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
              {(t.delete?.deleteRecord?.description || "This action cannot be undone. You are about to delete one record from \"{collection}\".").replace('{collection}', state.collection)}
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
              {(t.delete?.deleteSelected?.description || "This action cannot be undone. You are about to delete {count} records from \"{collection}\".").replace('{count}', String(table.getFilteredSelectedRowModel().rows.length)).replace('{collection}', state.collection)}
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

      <ResponsiveDialog open={createOpen} onOpenChange={(open) => {
        setCreateOpen(open)
        if (!open) {
          // Clear form data and price inputs when dialog closes
          setFormData({})
          setCreateError(null)
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
      }}>
        <ResponsiveDialogContent className="max-h-[90vh] overflow-y-auto p-5">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{(() => {
              const collectionToEntityKey = (collection: string): string => {
                const specialCases: Record<string, string> = {
                  'echelon_employees': 'employee_echelon',
                  'product_variants': 'product_variant',
                  'asset_variants': 'asset_variant',
                  'text_variants': 'text_variant',
                  'wallet_transactions': 'wallet_transaction',
                  'base_moves': 'base_move',
                  'base_move_routes': 'base_move_route',
                  'message_threads': 'message_thread',
                  'outreach_referrals': 'outreach_referral',
                  'echelons': 'employee_echelon',
                  'employee_timesheets': 'employee_timesheet',
                  'employee_leaves': 'employee_leave',
                  'journal_generations': 'journal_generation',
                  'journal_connections': 'journal_connection',
                  'user_sessions': 'user_session',
                  'user_bans': 'user_ban',
                  'user_verifications': 'user_verification',
                  'role_permissions': 'role_permission',
                }
                if (specialCases[collection]) return specialCases[collection]
                if (collection.endsWith('ies')) return collection.slice(0, -3) + 'y'
                if (collection.endsWith('es') && !collection.endsWith('ses')) return collection.slice(0, -2)
                if (collection.endsWith('s')) return collection.slice(0, -1)
                return collection
              }
              const entityKey = collectionToEntityKey(state.collection)
              const entityOptions = (translations as any)?.taxonomy?.entityOptions || {}
              const collectionLabel = entityOptions[entityKey] || state.collection
              return t.addRecord.title.replace('{collection}', collectionLabel)
            })()}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {t.addRecord.description}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {editableFields.map((field) => (
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
<<<<<<< HEAD
                ) : field.fieldType === 'json' && state.collection === 'taxonomy' && (field.name === 'title' || field.name === 'category') ? (
                  <>
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`field-${field.name}`} className="text-sm font-medium">
                        {field.title || field.name}
                        {!field.nullable && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      <Tabs
                        value={jsonFieldLanguage[field.name] || locale}
                        onValueChange={(value) => setJsonFieldLanguage(prev => ({ ...prev, [field.name]: value as 'en' | 'ru' }))}
                        className="w-auto"
                      >
                        <TabsList className="h-8">
                          <TabsTrigger value="en" className="text-xs px-2 py-1">EN</TabsTrigger>
                          <TabsTrigger value="ru" className="text-xs px-2 py-1">RU</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                    <Tabs
                      value={jsonFieldLanguage[field.name] || locale}
                      onValueChange={(value) => setJsonFieldLanguage(prev => ({ ...prev, [field.name]: value as 'en' | 'ru' }))}
                      className="w-full"
                    >
                      <TabsContent value="en" className="mt-0">
                        <Input
                          id={`field-${field.name}_en`}
                          type="text"
                          required={!field.nullable}
                          value={formData[`${field.name}_en`] || ""}
                          onChange={(e) => handleFieldChange(`${field.name}_en`, e.target.value)}
                          placeholder={t.form?.enter?.replace('{field}', `${field.title || field.name} (English)`) || `Enter ${field.title || field.name} (English)`}
                        />
                      </TabsContent>
                      <TabsContent value="ru" className="mt-0">
                        <Input
                          id={`field-${field.name}_ru`}
                          type="text"
                          required={!field.nullable}
                          value={formData[`${field.name}_ru`] || ""}
                          onChange={(e) => handleFieldChange(`${field.name}_ru`, e.target.value)}
                          placeholder={t.form?.enter?.replace('{field}', field.title || field.name) || `Enter ${field.title || field.name}`}
                        />
                      </TabsContent>
                    </Tabs>
                  </>
                ) : field.fieldType === 'select' && field.selectOptions ? (
=======
                ) : (field as any).fieldType === 'price' ? (
>>>>>>> 204496219e9b854a27930a418936c21a3b6098e4
                  <>
                    <Label htmlFor={`field-${field.name}`} className="text-sm font-medium">
                      {field.title || field.name}
                      {!field.nullable && <span className="text-destructive ml-1">*</span>}
                    </Label>
<<<<<<< HEAD
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
=======
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
                        // Store raw input value for free editing
                        setPriceInputs(prev => ({ ...prev, [`create-${field.name}`]: v }))
                        // limit to two decimals
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
                        // Format on blur
                        if (v.includes('.')) {
                          const [i, d] = v.split('.')
                          v = `${i}.${d.slice(0, 2)}`
                        }
                        const num = v === '' ? NaN : Number(v)
                        if (isFinite(num)) {
                          const formatted = num.toFixed(2)
                          setPriceInputs(prev => ({ ...prev, [`create-${field.name}`]: formatted }))
                          const cents = Math.round(num * 100)
                          handleFieldChange(field.name, cents)
                        }
                      }}
                      placeholder={`Enter ${field.title || field.name}`}
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
>>>>>>> 204496219e9b854a27930a418936c21a3b6098e4
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
<<<<<<< HEAD
                      translations={t}
=======
                      search={state.search}
>>>>>>> 204496219e9b854a27930a418936c21a3b6098e4
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
            {createError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {createError}
              </div>
            )}
            <ResponsiveDialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                {t.form?.cancel || "Cancel"}
              </Button>
              <Button type="submit">{t.form?.create || "Create"}</Button>
            </ResponsiveDialogFooter>
          </form>
          <ResponsiveDialogClose className="sr-only" />
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ResponsiveDialog open={editOpen} onOpenChange={(open) => {
        setEditOpen(open)
        if (!open) {
          // Clear edit data and price inputs when dialog closes
          setEditData({})
          setEditError(null)
          setRecordToEdit(null)
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
      }}>
        <ResponsiveDialogContent className="max-h-[90vh] overflow-y-auto p-5">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{(() => {
              const collectionToEntityKey = (collection: string): string => {
                const specialCases: Record<string, string> = {
                  'echelon_employees': 'employee_echelon',
                  'product_variants': 'product_variant',
                  'asset_variants': 'asset_variant',
                  'text_variants': 'text_variant',
                  'wallet_transactions': 'wallet_transaction',
                  'base_moves': 'base_move',
                  'base_move_routes': 'base_move_route',
                  'message_threads': 'message_thread',
                  'outreach_referrals': 'outreach_referral',
                  'echelons': 'employee_echelon',
                  'employee_timesheets': 'employee_timesheet',
                  'employee_leaves': 'employee_leave',
                  'journal_generations': 'journal_generation',
                  'journal_connections': 'journal_connection',
                  'user_sessions': 'user_session',
                  'user_bans': 'user_ban',
                  'user_verifications': 'user_verification',
                  'role_permissions': 'role_permission',
                }
                if (specialCases[collection]) return specialCases[collection]
                if (collection.endsWith('ies')) return collection.slice(0, -3) + 'y'
                if (collection.endsWith('es') && !collection.endsWith('ses')) return collection.slice(0, -2)
                if (collection.endsWith('s')) return collection.slice(0, -1)
                return collection
              }
              const entityKey = collectionToEntityKey(state.collection)
              const entityOptions = (translations as any)?.taxonomy?.entityOptions || {}
              const collectionLabel = entityOptions[entityKey] || state.collection
              return (t.editRecord?.title || "Edit record in {collection}").replace('{collection}', collectionLabel)
            })()}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {t.editRecord?.description || "Change fields below. Auto-generated fields are not editable and hidden."}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {schema.filter((f) => !isAutoGeneratedField(f.name, !!f.relation) && !f.primary && !f.hidden).map((field) => (
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
<<<<<<< HEAD
                ) : field.fieldType === 'json' && state.collection === 'taxonomy' && (field.name === 'title' || field.name === 'category') ? (
                  <>
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`edit-field-${field.name}`} className="text-sm font-medium">
                        {field.title || field.name}
                        {!field.nullable && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      <Tabs
                        value={jsonFieldLanguage[field.name] || locale}
                        onValueChange={(value) => setJsonFieldLanguage(prev => ({ ...prev, [field.name]: value as 'en' | 'ru' }))}
                        className="w-auto"
                      >
                        <TabsList className="h-8">
                          <TabsTrigger value="en" className="text-xs px-2 py-1">EN</TabsTrigger>
                          <TabsTrigger value="ru" className="text-xs px-2 py-1">RU</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                    <Tabs
                      value={jsonFieldLanguage[field.name] || locale}
                      onValueChange={(value) => setJsonFieldLanguage(prev => ({ ...prev, [field.name]: value as 'en' | 'ru' }))}
                      className="w-full"
                    >
                      <TabsContent value="en" className="mt-0">
                        <Input
                          id={`edit-field-${field.name}_en`}
                          type="text"
                          required={!field.nullable}
                          value={editData[`${field.name}_en`] || ""}
                          onChange={(e) => handleEditFieldChange(`${field.name}_en`, e.target.value)}
                          placeholder={t.form?.enter?.replace('{field}', `${field.title || field.name} (English)`) || `Enter ${field.title || field.name} (English)`}
                          disabled={field.readOnly}
                        />
                      </TabsContent>
                      <TabsContent value="ru" className="mt-0">
                        <Input
                          id={`edit-field-${field.name}_ru`}
                          type="text"
                          required={!field.nullable}
                          value={editData[`${field.name}_ru`] || ""}
                          onChange={(e) => handleEditFieldChange(`${field.name}_ru`, e.target.value)}
                          placeholder={t.form?.enter?.replace('{field}', field.title || field.name) || `Enter ${field.title || field.name}`}
                          disabled={field.readOnly}
                        />
                      </TabsContent>
                    </Tabs>
                  </>
                ) : field.fieldType === 'select' && field.selectOptions ? (
=======
                ) : (field as any).fieldType === 'price' ? (
>>>>>>> 204496219e9b854a27930a418936c21a3b6098e4
                  <>
                    <Label htmlFor={`edit-field-${field.name}`} className="text-sm font-medium">
                      {field.title || field.name}
                      {!field.nullable && <span className="text-destructive ml-1">*</span>}
                    </Label>
<<<<<<< HEAD
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
=======
                    <Input
                      id={`edit-field-${field.name}`}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      required={!field.nullable}
                      value={
                        priceInputs[`edit-${field.name}`] !== undefined
                          ? priceInputs[`edit-${field.name}`]
                          : editData[field.name] === undefined || editData[field.name] === null
                            ? ""
                            : (Number(editData[field.name]) / 100).toFixed(2)
                      }
                      onChange={(e) => {
                        let v = e.target.value.replace(/,/g, '.')
                        // Store raw input value for free editing
                        setPriceInputs(prev => ({ ...prev, [`edit-${field.name}`]: v }))
                        // limit to two decimals
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
                        // Format on blur
                        if (v.includes('.')) {
                          const [i, d] = v.split('.')
                          v = `${i}.${d.slice(0, 2)}`
                        }
                        const num = v === '' ? NaN : Number(v)
                        if (isFinite(num)) {
                          const formatted = num.toFixed(2)
                          setPriceInputs(prev => ({ ...prev, [`edit-${field.name}`]: formatted }))
                          const cents = Math.round(num * 100)
                          handleEditFieldChange(field.name, cents)
                        }
                      }}
                      disabled={field.readOnly}
                    />
                  </>
                ) : field.fieldType === 'enum' && field.enum ? (
                  <>
                    <Label htmlFor={`edit-field-${field.name}`} className="text-sm font-medium">
                      {field.title || field.name}
                      {!field.nullable && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Select
                      value={editData[field.name] || ""}
                      onValueChange={(value) => handleEditFieldChange(field.name, value)}
                      required={!field.nullable}
                      disabled={field.readOnly}
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
>>>>>>> 204496219e9b854a27930a418936c21a3b6098e4
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
                      required={!field.nullable}
                      disabled={field.readOnly}
<<<<<<< HEAD
                      translations={t}
=======
                      search={state.search}
>>>>>>> 204496219e9b854a27930a418936c21a3b6098e4
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
            {editError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {editError}
              </div>
            )}
            <ResponsiveDialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                {t.form?.cancel || "Cancel"}
              </Button>
              <Button type="submit">{t.form?.save || "Save"}</Button>
            </ResponsiveDialogFooter>
          </form>
          <ResponsiveDialogClose className="sr-only" />
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </Tabs>
  )
}

