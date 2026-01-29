"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
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
import { getCollection } from "@/shared/collections/getCollection"
import type { AdminFilter } from "@/shared/types"
import { useLocale } from "@/packages/hooks/use-locale"
import { getProductSlug, getCategorySlug } from "@/lib/slug"
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import { EditForm } from "./data-table/EditForm"
import { CreateForm } from "./data-table/CreateForm"
import { RelationSelect } from "./data-table/RelationSelect"

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
  multiple?: boolean
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
  fieldType?: 'text' | 'number' | 'email' | 'phone' | 'password' | 'boolean' | 'date' | 'time' | 'datetime' | 'json' | 'array' | 'object' | 'price' | 'enum' | 'image' | 'images' | 'tiptap'
  textarea?: boolean
  enum?: {
    values: string[]
    labels: string[]
  }
  relation?: RelationConfig
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

// Dynamic column generator
function generateColumns(schema: ColumnSchemaExtended[], onDeleteRequest: (row: Row<CollectionData>) => void, onEditRequest: (row: Row<CollectionData>) => void, locale: string = 'en', relationData: Record<string, Record<any, string>> = {}, collection: string = '', basePath: string = '/admin'): ColumnDef<CollectionData>[] {
  // Find images field for products and texts collections
  const imagesField = (collection === 'products' || collection === 'texts') ? schema.find(col => col.name === 'dataIn.images') : null
  
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
          aria-label="Выбрать все"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Выбрать строку"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  // Image column for products and texts (only if images field exists)
  ...(imagesField ? [{
    id: "image",
    header: () => <div className="w-16"></div>,
    cell: ({ row }: { row: Row<CollectionData> }) => {
      const imagesValue = row.original[imagesField.name]
      let imageUrl: string | null = null
      
      // Get first image from array
      if (imagesValue) {
        let images: string[] = []
        if (typeof imagesValue === 'string') {
          try {
            const parsed = JSON.parse(imagesValue)
            images = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : [])
          } catch {
            images = imagesValue ? [imagesValue] : []
          }
        } else if (Array.isArray(imagesValue)) {
          images = imagesValue
        } else if (imagesValue) {
          images = [imagesValue]
        }
        
        if (images.length > 0) {
          const firstImage = images[0]
          // Handle paths with images/ prefix or full paths
          if (firstImage.startsWith('/images/')) {
            imageUrl = firstImage
          } else if (firstImage.startsWith('images/')) {
            imageUrl = `/${firstImage}`
          } else {
            // Extract filename if it contains path, or use as is
            const filename = firstImage.includes('/') 
              ? firstImage.split('/').pop() || firstImage
              : firstImage
            imageUrl = `/images/${filename}`
          }
        }
      }
      
      return (
        <div className="w-16 h-16 flex items-center justify-center">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt="" 
              className="w-full h-full object-cover rounded border"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-full h-full bg-muted rounded border flex items-center justify-center">
              <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      )
    },
    enableSorting: false,
    enableHiding: false,
  }] : []),
    // For products collection, define custom column order
    ...(collection === 'products' ? (() => {
      // Use title field based on current locale, hide the other language title
      const titleField = `title.${locale}`
      const otherTitleField = locale === 'ru' ? 'title.en' : 'title.ru'
      const columnOrder = ['paid', titleField, 'category', 'dataIn.price', 'status_name']
      const orderedCols: ColumnSchemaExtended[] = []
      const remainingCols: ColumnSchemaExtended[] = []
      
      // First, add columns in specified order
      for (const colName of columnOrder) {
        const col = schema.find(c => c.name === colName && !c.hidden && !c.hiddenTable)
        if (col) {
          orderedCols.push(col)
        }
      }
      
      // Then add remaining columns (excluding hiddenTable fields and other language title)
      for (const col of schema) {
        if (!col.hidden && !col.hiddenTable && !columnOrder.includes(col.name) && col.name !== otherTitleField) {
          remainingCols.push(col)
        }
      }
      
      return [...orderedCols, ...remainingCols]
    })() : schema.filter(col => !col.hidden && !col.hiddenTable)).map((col) => ({
      accessorKey: col.name,
      enableSorting: true,
      header: ({ column }: { column: any }) => {
        const canSort = column.getCanSort();
        const sortDirection = column.getIsSorted();
        
        return (
          <div className="flex items-center gap-1">
            {canSort ? (
              <button
                className="flex items-center gap-1 hover:text-foreground transition-colors"
                onClick={() => column.toggleSorting(undefined, true)}
              >
                <span>{col.title || col.name}</span>
                {sortDirection === 'asc' ? (
                  <IconArrowUp className="h-4 w-4" />
                ) : sortDirection === 'desc' ? (
                  <IconArrowDown className="h-4 w-4" />
                ) : (
                  <IconArrowsSort className="h-4 w-4 text-muted-foreground opacity-50" />
                )}
              </button>
            ) : (
              <span>{col.title || col.name}</span>
            )}
            {col.primary && (
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                PK
              </Badge>
            )}
          </div>
        );
      },
      cell: ({ row }: { row: Row<CollectionData> }) => {
        const value = row.original[col.name]
        
        // For deals collection, make daid clickable
        if (collection === 'deals' && col.name === 'daid') {
          return (
            <div 
              className="text-primary underline cursor-pointer hover:text-primary/80"
              onClick={(e) => {
                e.stopPropagation()
                window.open(`${basePath}/deals/${value}`, '_blank')
              }}
            >
              {value || '-'}
            </div>
          )
        }
        
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
        // For price type, show as decimal with 2 digits or "по запросу" for text prices
        if (col.fieldType === 'price') {
          // Check if it's a text price field (for "по запросу" support)
          if (col.type === 'text') {
            const priceStr = value === null || value === undefined || value === '' || value === "0" || value === 0
              ? "по запросу"
              : String(value)
            return <div className={`${col.primary ? "font-mono font-medium" : ""}`}>{priceStr}</div>
          }
          // For numeric price fields
          const price =
            value === null || value === undefined || value === '' || value === 0 || value === "0"
              ? NaN
              : Number(value)
          const amount = isFinite(price) ? price.toFixed(2) : 'по запросу'
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
          // Handle multiple values for relation fields (e.g., multiple categories)
          if (col.relation.multiple && Array.isArray(value)) {
            const labels = value
              .map((v: any) => relationData[col.name][v] || v)
              .filter(Boolean)
            if (labels.length === 0) return <div>-</div>
            return (
              <div className="flex flex-wrap gap-1">
                {labels.map((label: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {label}
                  </Badge>
                ))}
              </div>
            )
          }
          const label = relationData[col.name][value] || value || "-"
          // For status_name, show as badge
          if (col.name === 'status_name') {
            return (
              <Badge variant={value === 'PUBLISHED' ? 'default' : value === 'DRAFT' ? 'secondary' : 'outline'}>
                {label}
              </Badge>
            )
          }
          return <div>{label}</div>
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
            <div className={`${col.primary ? "font-mono font-medium" : ""} truncate max-w-[300px]`} title={textValue}>
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
            <span className="sr-only">Открыть меню</span>
          </Button>
        </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem 
              onClick={() => {
                if (collection === 'products') {
                  const product = row.original
                  const productSlug = getProductSlug({ title: product.title || product['title.ru'], uuid: product.uuid || product.paid })
                  const categorySlug = getCategorySlug(product.category)
                  const url = `/catalog/${categorySlug}/${productSlug}`
                  window.open(url, '_blank')
                } else if (collection === 'texts') {
                  const text = row.original
                  // Try to get slug from dataIn or use id/uuid as fallback
                  let slug = ''
                  if (text.dataIn) {
                    if (typeof text.dataIn === 'string') {
                      try {
                        const parsed = JSON.parse(text.dataIn)
                        slug = parsed.slug
                      } catch {}
                    } else {
                      slug = text.dataIn.slug
                    }
                  }
                  // If no slug, try to use uuid or id, though api might not support it yet without modification
                  const url = `/news/${slug || text.uuid || text.id}`
                  window.open(url, '_blank')
                }
              }}
            >
              Просмотр
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditRequest(row)}>Редактировать</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => onDeleteRequest(row)}>
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]
}

export function DataTable() {
  const { state, setState } = useAdminState()
  const { locale } = useLocale()
  const pathname = usePathname()
  
  // Determine base path based on current route
  const basePath = React.useMemo(() => {
    return pathname?.startsWith('/editor') ? '/editor' : '/admin'
  }, [pathname])

  const [data, setData] = React.useState<CollectionData[]>([])
  const [schema, setSchema] = React.useState<ColumnSchemaExtended[]>([])
  const [total, setTotal] = React.useState(0)
  const [totalPages, setTotalPages] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [relationData, setRelationData] = React.useState<Record<string, Record<any, string>>>({})
  
  // Local search state for input (debounced before updating global state)
  const [searchInput, setSearchInput] = React.useState(state.search)
  
  // Local state for price inputs to allow free input without formatting interference
  const [priceInputs, setPriceInputs] = React.useState<Record<string, string>>({})

  // Table state (sorting, pagination, etc.)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])

  const primaryKey = React.useMemo(() => schema.find((c) => c.primary)?.name || "id", [schema])

  const fetchData = React.useCallback(async (abortSignal?: AbortSignal, isMountedRef?: { current: boolean }) => {
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
      

      if (isMountedRef && !isMountedRef.current) return
      
      if (!res.ok) {
        throw new Error(`Failed to load: ${res.status}`)
      }
      const json: StateResponse = await res.json()
      

      if (isMountedRef && !isMountedRef.current) return
      
      // Get collection config and apply column settings
      const collection = getCollection(state.collection)
      const extendedColumns: ColumnSchemaExtended[] = json.schema.columns.map((col) => {
        const columnConfig = (collection as any)[col.name]
        const options = columnConfig?.options || {}
        
        // Determine fieldType: use fieldType from options if set, otherwise use type, but check for special cases
        let fieldType = options.fieldType || options.type
        // Special handling for images field: if field name contains 'images' (plural), use 'images' type
        if (col.name.toLowerCase().includes('images') && options.type === 'json' && !options.fieldType) {
          fieldType = 'images'
        } else if (col.name.toLowerCase().includes('image') && !col.name.toLowerCase().includes('images') && options.type === 'json' && !options.fieldType) {
          fieldType = 'image'
        }
        
        return {
          ...col,
          title: options.title,
          hidden: options.hidden || false,
          hiddenTable: options.hiddenTable || false,
          readOnly: options.readOnly || false,
          required: options.required || false,
          virtual: options.virtual || false,
          defaultCell: options.defaultCell,
          format: options.format,
          fieldType: fieldType,
          textarea: options.textarea || false,
          enum: options.enum,
          relation: options.relation,
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
              let label: string
              
              if (col.relation!.labelFields) {
                label = col.relation!.labelFields.map(f => item[f]).filter(Boolean).join(" ")
              } else {
                const labelFieldValue = item[col.relation!.labelField]
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
      
      // Update local state (preserve search from current state)
      setState((prev: any) => ({ ...prev, ...json.state }))
      setSchema(extendedColumns)
      setTotal(json.schema.total)
      setTotalPages(json.schema.totalPages)
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
  }, [state.collection, state.page, state.pageSize, state.search, JSON.stringify(state.filters), setState])

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
        setState((prev: any) => ({
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
    setState((prev: any) => ({
      ...prev,
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
    }))
  }, [pagination.pageIndex, pagination.pageSize, setState])

  React.useEffect(() => {
    // when admin state changes externally (via URL), update table
    setPagination({ pageIndex: Math.max(0, state.page - 1), pageSize: state.pageSize })
  }, [state.page, state.pageSize])

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

  // Clear form data when collection changes
  React.useEffect(() => {
    setFormData({})
    setCreateError(null)
    setPriceInputs({})
  }, [state.collection])

  // Fields to skip (auto-generated): id, uuid, {x}aid (but not relation fields), created_at, updated_at, deleted_at
  const isAutoGeneratedField = React.useCallback((fieldName: string, hasRelation?: boolean): boolean => {
    const lower = fieldName.toLowerCase()
    return (
      lower === 'id' ||
      lower === 'uuid' ||
      (lower.endsWith('aid') && !hasRelation) || // Skip aid fields unless they have relations
      lower === 'created_at' ||
      lower === 'updated_at' ||
      lower === 'deleted_at'
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
    setPriceInputs({})
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
        } else if (col.fieldType === 'price') {
          const price = record[col.name]
          // For text price fields, keep as string; for numeric, convert to number
          if (col.type === 'text') {
            initial[col.name] = price == null || price === "" || price === 0 || price === "0" ? "по запросу" : String(price)
          } else {
            initial[col.name] = price == null ? null : Number(price)
          }
        } else if (col.fieldType === 'number') {
          const num = record[col.name]
          // Handle both number and string values, including 0
          // Also handle string "0" and empty strings
          // Important: 0 is a valid value, so check for null/undefined/empty string explicitly
          if (num === null || num === undefined || num === '') {
            initial[col.name] = null
          } else {
            // Convert to number, preserving 0
            const parsed = Number(num)
            initial[col.name] = isNaN(parsed) ? null : parsed
          }
        } else if (col.fieldType === 'images' || (col.relation && col.relation.multiple)) {
          // Handle images array field or multiple relation arrays (like categories, roles)
          const arrayValue = record[col.name]
          // Check for null, undefined, empty string, or empty array
          if (arrayValue == null || arrayValue === '') {
            initial[col.name] = []
          } else if (typeof arrayValue === 'string') {
            try {
              const parsed = JSON.parse(arrayValue)
              initial[col.name] = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : [])
            } catch {
              // If it's not valid JSON, treat as single value
              initial[col.name] = arrayValue ? [arrayValue] : []
            }
          } else if (Array.isArray(arrayValue)) {
            initial[col.name] = arrayValue
          } else {
            // Single value, convert to array
            initial[col.name] = arrayValue ? [arrayValue] : []
          }
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
    setEditOpen(true)
  }, [schema, isAutoGeneratedField])

  const handleEditFieldChange = React.useCallback((fieldName: string, value: string | boolean | Date | number | null | string[]) => {
    setEditData((prev) => ({ ...prev, [fieldName]: value }))
  }, [])

  // Create dialog keep after
  // Generate columns dynamically
  const columns = React.useMemo(
    () => (schema.length > 0 ? generateColumns(schema, onDeleteRequest, onEditRequest, locale, relationData, state.collection, basePath) : []),
    [schema, onDeleteRequest, onEditRequest, locale, relationData, state.collection, basePath]
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
    manualSorting: false, // Client-side sorting - no server requests on sort change
    enableRowSelection: true,
    enableMultiSort: true,
    enableSortingRemoval: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(), // Client-side sorting
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
      // Convert Date objects to ISO strings and serialize JSON fields for API
      const payload = Object.entries(formData).reduce((acc, [key, value]) => {
        const field = schema.find(f => f.name === key)
        if (field?.fieldType === 'images' && Array.isArray(value)) {
          acc[key] = value // Keep as array, server will handle it
        } else if (field?.fieldType === 'json' && value != null && typeof value === 'object') {
          acc[key] = value // Keep as object, server will stringify
        } else if (field?.fieldType === 'price') {
          // For price fields, include value if it's a number, or null if nullable
          // Price is stored as decimal number in DB
          if (value != null && typeof value === 'number') {
            acc[key] = value
          } else if (value === null && field.nullable) {
            acc[key] = null
          }
          // If null/undefined and not nullable, skip (validation should catch this)
        } else if (field?.fieldType === 'number') {
          // For number fields, send as number (will be converted to string in JSON if needed by server)
          if (value != null && typeof value === 'number') {
            acc[key] = value
          } else if (value === null && field.nullable) {
            acc[key] = null
          } else if (value != null) {
            // Try to convert string to number
            const num = Number(value)
            acc[key] = isNaN(num) ? (field.nullable ? null : undefined) : num
          }
        } else if (value instanceof Date) {
          acc[key] = value.toISOString()
        } else {
          acc[key] = value
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

  const handleFieldChange = React.useCallback((fieldName: string, value: string | boolean | Date | number | null | string[]) => {
    setFormData((prev: Record<string, any>) => ({ ...prev, [fieldName]: value }))
  }, [])

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log('[handleEditSubmit] Form submitted', { recordToEdit, editData })
    
    if (!recordToEdit) {
      console.error('[handleEditSubmit] No recordToEdit')
      return
    }
    setEditError(null)
    
    // Check password confirmation manually (since it's not in editData)
    const passwordField = schema.find(f => f.fieldType === 'password')
    if (passwordField && editData[passwordField.name]) {
      const passwordValue = editData[passwordField.name]
      // Get confirmation from DOM since it's not in state
      const confirmInput = document.getElementById(`${passwordField.name}-confirm`) as HTMLInputElement
      if (confirmInput && confirmInput.value && passwordValue !== confirmInput.value) {
        setEditError('Пароли не совпадают')
        return
      }
    }
    
    try {
      // Convert Date objects to ISO strings and keep JSON fields as objects for API
      const payload = Object.entries(editData).reduce((acc, [key, value]) => {
        const field = schema.find(f => f.name === key)
        // Handle array fields (like roles) - always include even if empty
        if (Array.isArray(value)) {
          acc[key] = value // Keep as array, server will handle it
        } else if (field?.fieldType === 'images' && Array.isArray(value)) {
          acc[key] = value // Keep as array, server will handle it
        } else if (field?.fieldType === 'json' && value != null && typeof value === 'object') {
          acc[key] = value // Keep as object, server will stringify
        } else if (field?.fieldType === 'price') {
          // For price fields, include value if it's a number, or null if nullable
          // Price is stored as decimal number in DB
          if (value != null && typeof value === 'number') {
            acc[key] = value
          } else if (value === null && field.nullable) {
            acc[key] = null
          }
          // If null/undefined and not nullable, skip (validation should catch this)
        } else if (field?.fieldType === 'number') {
          // For number fields, send as number (will be converted to string in JSON if needed by server)
          if (value != null && typeof value === 'number') {
            acc[key] = value
          } else if (value === null && field.nullable) {
            acc[key] = null
          } else if (value != null) {
            // Try to convert string to number
            const num = Number(value)
            acc[key] = isNaN(num) ? (field.nullable ? null : undefined) : num
          }
        } else if (field?.fieldType === 'date' || field?.fieldType === 'time' || field?.fieldType === 'datetime') {
          // For date/time fields, skip empty strings (don't update them)
          if (value === '' || value === null || value === undefined) {
            return acc
          } else if (value instanceof Date) {
            acc[key] = value.toISOString()
          } else {
            acc[key] = value
          }
        } else if (value instanceof Date) {
          acc[key] = value.toISOString()
        } else if (typeof value === 'string' && value === '') {
          // Skip empty strings (they shouldn't be sent to update)
          return acc
        } else {
          acc[key] = value
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
            placeholder="Поиск..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Label htmlFor="view-selector" className="sr-only">
          Вид
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
              <span className="hidden lg:inline">Удалить выбранные</span>
              <span className="lg:hidden">Удалить</span>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Настроить колонки</span>
                <span className="lg:hidden">Колонки</span>
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
                      {(() => {
                        // Get column title from schema
                        const accessorKey = (column as any).accessorKey as string
                        const colSchema = schema.find(c => c.name === column.id || c.name === accessorKey)
                        return colSchema?.title || column.id
                      })()}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
            <IconPlus />
            <span className="hidden lg:inline">Добавить</span>
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
            <span className="ml-2 text-sm text-muted-foreground">Загрузка {state.collection}...</span>
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
                        Данные не найдены в {state.collection}.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                {table.getFilteredSelectedRowModel().rows.length} выбрано · {total} всего записей
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Записей на странице
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
                  Страница {state.page} из {totalPages || 1}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                    disabled={state.page === 1}
              >
                <span className="sr-only">На первую страницу</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                    disabled={state.page === 1}
              >
                <span className="sr-only">На предыдущую страницу</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                    disabled={state.page >= totalPages}
              >
                <span className="sr-only">На следующую страницу</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                    onClick={() => table.setPageIndex(totalPages - 1)}
                    disabled={state.page >= totalPages}
              >
                <span className="sr-only">На последнюю страницу</span>
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
            <ResponsiveDialogTitle>Удалить запись?</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Это действие нельзя отменить. Вы собираетесь удалить одну запись из "{state.collection}".
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Отмена</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Удалить</Button>
          </ResponsiveDialogFooter>
          <ResponsiveDialogClose className="sr-only" />
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ResponsiveDialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
        <ResponsiveDialogContent className="p-5">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Удалить выбранные записи?</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Это действие нельзя отменить. Вы собираетесь удалить {table.getFilteredSelectedRowModel().rows.length} записей из "{state.collection}".
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <Button variant="outline" onClick={() => setBatchDeleteOpen(false)} disabled={batchDeleting}>Отмена</Button>
            <Button variant="destructive" onClick={handleBatchDelete} disabled={batchDeleting}>
              {batchDeleting ? (
                <>
                  <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                  Удаление...
                </>
              ) : (
                'Удалить все'
              )}
            </Button>
          </ResponsiveDialogFooter>
          <ResponsiveDialogClose className="sr-only" />
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <CreateForm
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) {
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
        }}
        collection={state.collection}
        schema={schema}
        formData={formData}
        createError={createError}
        priceInputs={priceInputs}
        setPriceInputs={setPriceInputs}
        onFieldChange={handleFieldChange}
        onSubmit={handleCreateSubmit}
        search={state.search}
        editableFields={editableFields}
      />

      <EditForm
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) {
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
        }}
        collection={state.collection}
        record={recordToEdit}
        schema={schema}
        editData={editData}
        editError={editError}
        priceInputs={priceInputs}
        setPriceInputs={setPriceInputs}
        onFieldChange={handleEditFieldChange}
        onSubmit={handleEditSubmit}
        search={state.search}
        isAutoGeneratedField={isAutoGeneratedField}
      />
    </Tabs>
  )
}

