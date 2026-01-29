"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogClose,
} from "@/packages/components/ui/revola"
import { FieldRenderer } from "./FieldRenderer"
import type { ColumnSchemaExtended } from "./types"

interface CreateFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collection: string
  schema: ColumnSchemaExtended[]
  formData: Record<string, any>
  createError: string | null
  priceInputs: Record<string, string>
  setPriceInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onFieldChange: (fieldName: string, value: any) => void
  onSubmit: (e: React.FormEvent) => void
  search?: string
  editableFields: ColumnSchemaExtended[]
}

export function CreateForm({
  open,
  onOpenChange,
  collection,
  schema,
  formData,
  createError,
  priceInputs,
  setPriceInputs,
  onFieldChange,
  onSubmit,
  search,
  editableFields,
}: CreateFormProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-h-[90vh] overflow-y-auto p-5">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Добавить новую запись в {collection}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Заполните поля ниже. Автоматически генерируемые поля (id, uuid, aid/raid/haid, created_at, updated_at, deleted_at) скрыты и будут созданы автоматически.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 p-4">
          {editableFields.map((field) => (
            <div key={field.name} className="flex flex-col gap-2">
              <FieldRenderer
                field={field}
                value={formData[field.name]}
                onChange={(value) => onFieldChange(field.name, value)}
                dialogType="create"
                priceInputs={priceInputs}
                setPriceInputs={setPriceInputs}
                search={search}
              />
            </div>
          ))}
          {createError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {createError}
            </div>
          )}
          <ResponsiveDialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit">Создать</Button>
          </ResponsiveDialogFooter>
        </form>
        <ResponsiveDialogClose className="sr-only" />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

