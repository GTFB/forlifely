import * as React from "react"
import {
  IconCalendar,
  IconChevronDown,
  IconDeviceFloppy,
  IconDownload,
  IconPlus,
  IconTrash,
  IconUpload,
  IconX,
} from "@tabler/icons-react"
import { DateTimePicker } from "@/packages/components/ui/date-time-picker"
import { DayPicker, DateRange } from "react-day-picker"
import type { Locale } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { SmartSearch } from "./SmartSearch"
import { DataTableColumnSettings, type DataTableColumnSettingsProps } from "./DataTableColumnSettings"
import type { ExportFormat } from "@/shared/utils/table-export"

type DateFilterState = {
  type: "created_at" | "updated_at" | null
  range:
    | "today"
    | "yesterday"
    | "last7days"
    | "last30days"
    | "last90days"
    | "thisMonth"
    | "lastMonth"
    | "thisYear"
    | "lastYear"
    | "custom"
    | "single"
    | null
  customStart?: Date
  customEnd?: Date
  singleDate?: Date
}

type TempSingleDateState = {
  created: Date | null
  updated: Date | null
}

type TempDateRangeState = {
  created: DateRange | undefined
  updated: DateRange | undefined
}

type DataTableToolbarProps = {
  t: any
  dateFilter: DateFilterState
  tempSingleDate: TempSingleDateState
  setTempSingleDate: React.Dispatch<React.SetStateAction<TempSingleDateState>>
  tempDateRange: TempDateRangeState
  setTempDateRange: React.Dispatch<React.SetStateAction<TempDateRangeState>>
  dateFnsLocale: Locale
  applyDateFilter: (
    type: "created_at" | "updated_at",
    range: Exclude<DateFilterState["range"], null>,
    start?: Date,
    end?: Date,
    single?: Date
  ) => void
  clearDateFilter: () => void
  searchValue: string
  onSearchChange: (value: string) => void
  batchDeleting: boolean
  onBatchDelete: () => void
  handleExport: (format: ExportFormat) => void
  onImportOpen: () => void
  editMode: boolean
  hasUnsavedChanges: boolean
  onSaveAllChanges: () => Promise<void>
  columnSettingsProps: DataTableColumnSettingsProps
  onCreateOpen: () => void
}

export function DataTableToolbar({
  t,
  dateFilter,
  tempSingleDate,
  setTempSingleDate,
  tempDateRange,
  setTempDateRange,
  dateFnsLocale,
  applyDateFilter,
  clearDateFilter,
  searchValue,
  onSearchChange,
  batchDeleting,
  onBatchDelete,
  handleExport,
  onImportOpen,
  editMode,
  hasUnsavedChanges,
  onSaveAllChanges,
  columnSettingsProps,
  onCreateOpen,
}: DataTableToolbarProps) {
  const { table } = columnSettingsProps

  return (
    <div className="flex items-center gap-2 px-0">
      {/* Date Filter Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="bg-primary-foreground h-9">
            <IconCalendar className="h-4 w-4" />
            <span className="hidden lg:inline">
              {dateFilter.type && dateFilter.range
                ? (dateFilter.type === "created_at"
                  ? (t.dateFilter?.created || "Created")
                  : (t.dateFilter?.updated || "Updated"))
                : (t.dateFilter?.filter || "Date Filter")}
            </span>
            {dateFilter.type && dateFilter.range && (
              <IconX
                className="h-3 w-3 ml-1"
                onClick={(e) => {
                  e.stopPropagation()
                  clearDateFilter()
                }}
              />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>{t.dateFilter?.filterBy || "Filter by"}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              {t.dateFilter?.created || "Created"}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-auto min-w-[280px]">
              <DropdownMenuItem onClick={() => applyDateFilter("created_at", "today")}>
                {t.dateFilter?.today || "Today"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyDateFilter("created_at", "yesterday")}>
                {t.dateFilter?.yesterday || "Yesterday"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyDateFilter("created_at", "last7days")}>
                {t.dateFilter?.last7days || "Last 7 days"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyDateFilter("created_at", "last30days")}>
                {t.dateFilter?.last30days || "Last 30 days"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyDateFilter("created_at", "last90days")}>
                {t.dateFilter?.last90days || "Last 90 days"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyDateFilter("created_at", "thisMonth")}>
                {t.dateFilter?.thisMonth || "This month"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyDateFilter("created_at", "lastMonth")}>
                {t.dateFilter?.lastMonth || "Last month"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyDateFilter("created_at", "thisYear")}>
                {t.dateFilter?.thisYear || "This year"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyDateFilter("created_at", "lastYear")}>
                {t.dateFilter?.lastYear || "Last year"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>{t.dateFilter?.selectDate || "Select date"}</DropdownMenuLabel>
              <div className="px-2 py-1.5">
                <DateTimePicker
                  mode="date"
                  value={tempSingleDate.created || undefined}
                  onChange={(date) => {
                    if (date) {
                      setTempSingleDate((prev) => ({ ...prev, created: date }))
                      applyDateFilter("created_at", "single", undefined, undefined, date)
                    }
                  }}
                />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>{t.dateFilter?.dateRange || "Date range"}</DropdownMenuLabel>
              <div className="px-2 py-1.5">
                <DayPicker
                  mode="range"
                  selected={tempDateRange.created}
                  onSelect={(range) => {
                    setTempDateRange((prev) => ({
                      ...prev,
                      created: range,
                    }))
                    if (range?.from && range.to) {
                      applyDateFilter("created_at", "custom", range.from, range.to)
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
                    range_start: "day-range-start",
                  }}
                />
              </div>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              {t.dateFilter?.updated || "Updated"}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-auto min-w-[280px]">
              <DropdownMenuItem onClick={() => applyDateFilter("updated_at", "today")}>
                {t.dateFilter?.today || "Today"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyDateFilter("updated_at", "yesterday")}>
                {t.dateFilter?.yesterday || "Yesterday"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyDateFilter("updated_at", "last7days")}>
                {t.dateFilter?.last7days || "Last 7 days"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyDateFilter("updated_at", "last30days")}>
                {t.dateFilter?.last30days || "Last 30 days"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyDateFilter("updated_at", "last90days")}>
                {t.dateFilter?.last90days || "Last 90 days"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyDateFilter("updated_at", "thisMonth")}>
                {t.dateFilter?.thisMonth || "This month"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyDateFilter("updated_at", "lastMonth")}>
                {t.dateFilter?.lastMonth || "Last month"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyDateFilter("updated_at", "thisYear")}>
                {t.dateFilter?.thisYear || "This year"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyDateFilter("updated_at", "lastYear")}>
                {t.dateFilter?.lastYear || "Last year"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>{t.dateFilter?.selectDate || "Select date"}</DropdownMenuLabel>
              <div className="px-2 py-1.5">
                <DateTimePicker
                  mode="date"
                  value={tempSingleDate.updated || undefined}
                  onChange={(date) => {
                    if (date) {
                      setTempSingleDate((prev) => ({ ...prev, updated: date }))
                      applyDateFilter("updated_at", "single", undefined, undefined, date)
                    }
                  }}
                />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>{t.dateFilter?.dateRange || "Date range"}</DropdownMenuLabel>
              <div className="px-2 py-1.5">
                <DayPicker
                  mode="range"
                  selected={tempDateRange.updated}
                  onSelect={(range) => {
                    setTempDateRange((prev) => ({
                      ...prev,
                      updated: range,
                    }))
                    if (range?.from && range.to) {
                      applyDateFilter("updated_at", "custom", range.from, range.to)
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
                    range_start: "day-range-start",
                  }}
                />
              </div>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          {dateFilter.type && dateFilter.range && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={clearDateFilter}>
                {t.dateFilter?.clear || "Clear filter"}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <SmartSearch
        value={searchValue}
        onChange={onSearchChange}
        placeholder={t.search}
      />

      <Label htmlFor="view-selector" className="sr-only">
        View
      </Label>
      <div className="flex items-center gap-1 lg:gap-2 ml-auto">
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            className="h-9"
            onClick={onBatchDelete}
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
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("xls")}>
                Excel (XLS)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("json")}>
                JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("sql")}>
                SQL
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onImportOpen}>
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
                  await onSaveAllChanges()
                } catch (e) {
                  console.error("Failed to save changes:", e)
                }
              }}
            >
              <IconDeviceFloppy className="h-4 w-4" />
              <span className="hidden lg:inline">{t.save || "Save"}</span>
            </Button>
          )}
        </div>
        <DataTableColumnSettings {...columnSettingsProps} />
        <Button variant="outline" size="sm" className="bg-primary-foreground h-9" onClick={onCreateOpen}>
          <IconPlus />
          <span className="hidden lg:inline">{t.add}</span>
        </Button>
      </div>
    </div>
  )
}
