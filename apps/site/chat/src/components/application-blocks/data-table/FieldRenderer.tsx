"use client"

import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/packages/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DateTimePicker } from "@/packages/components/ui/date-time-picker"
import { PhoneInput } from "@/packages/components/ui/phone-input"
import { MediaUpload } from "@/components/blocks-app/cms/MediaUpload"
import { MediaMultiSelect } from "@/components/blocks-app/cms/MediaMultiSelect"
import { TipTapEditor } from "@/components/blocks-app/cms/TipTapEditor"
import { RelationSelect } from "./RelationSelect"
import { IconEye, IconEyeOff } from "@tabler/icons-react"
import type { ColumnSchemaExtended } from "./types"

interface FieldRendererProps {
  field: ColumnSchemaExtended
  value: any
  onChange: (value: any) => void
  dialogType: 'create' | 'edit'
  priceInputs?: Record<string, string>
  setPriceInputs?: React.Dispatch<React.SetStateAction<Record<string, string>>>
  search?: string
  formData?: Record<string, any>
}

export function FieldRenderer({
  field,
  value,
  onChange,
  dialogType,
  priceInputs,
  setPriceInputs,
  search,
  formData,
}: FieldRendererProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  const [passwordConfirm, setPasswordConfirm] = React.useState('')
  const [passwordError, setPasswordError] = React.useState('')
  const fieldId = `${dialogType}-field-${field.name}`
  const priceInputKey = `${dialogType}-${field.name}`

  if (field.fieldType === 'boolean') {
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          id={fieldId}
          checked={value === true}
          onCheckedChange={(checked) => onChange(checked === true)}
          disabled={field.readOnly}
        />
        <Label htmlFor={fieldId} className="text-sm font-medium cursor-pointer">
          {field.title || field.name}
        </Label>
      </div>
    )
  }

  if (field.fieldType === 'date' || field.fieldType === 'time' || field.fieldType === 'datetime') {
    return (
      <>
        <Label htmlFor={fieldId} className="text-sm font-medium">
          {field.title || field.name}
          {!field.nullable && <span className="text-destructive ml-1">*</span>}
        </Label>
        <DateTimePicker
          mode={field.fieldType}
          value={value || null}
          onChange={(date) => onChange(date)}
          placeholder={`Выберите ${field.title || field.name}`}
          disabled={field.readOnly}
        />
      </>
    )
  }

  if (field.fieldType === 'phone') {
    return (
      <>
        <Label htmlFor={fieldId} className="text-sm font-medium">
          {field.title || field.name}
          {!field.nullable && <span className="text-destructive ml-1">*</span>}
        </Label>
        <PhoneInput
          value={value || ''}
          onChange={(val) => onChange(val || '')}
          placeholder={`Введите ${field.title || field.name}`}
          disabled={field.readOnly}
        />
      </>
    )
  }

  if (field.fieldType === 'password') {
    const handlePasswordChange = (newPassword: string) => {
      onChange(newPassword)
      if (passwordConfirm && newPassword !== passwordConfirm) {
        setPasswordError('Пароли не совпадают')
      } else {
        setPasswordError('')
      }
    }
    
    const handleConfirmChange = (confirm: string) => {
      setPasswordConfirm(confirm)
      if (value && value !== confirm) {
        setPasswordError('Пароли не совпадают')
      } else {
        setPasswordError('')
      }
    }
    
    return (
      <div className="space-y-3">
        <div>
          <Label htmlFor={fieldId} className="text-sm font-medium">
            {field.title || field.name}
            {!field.nullable && dialogType === 'create' && <span className="text-destructive ml-1">*</span>}
            {dialogType === 'edit' && <span className="text-muted-foreground text-xs ml-2">(оставьте пустым, если не хотите менять)</span>}
          </Label>
          <div className="relative">
            <Input
              id={fieldId}
              type={showPassword ? "text" : "password"}
              required={false}
              value={value || ''}
              onChange={(e) => handlePasswordChange(e.target.value)}
              disabled={field.readOnly}
              placeholder={dialogType === 'create' ? `Введите ${field.title || field.name}` : 'Новый пароль'}
              autoComplete="new-password"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? (
                <IconEyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <IconEye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>
        
        <div>
          <Label htmlFor={`${fieldId}-confirm`} className="text-sm font-medium">
            Подтверждение пароля
            {!field.nullable && dialogType === 'create' && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="relative">
            <Input
              id={`${fieldId}-confirm`}
              type={showPassword ? "text" : "password"}
              required={false}
              value={passwordConfirm}
              onChange={(e) => handleConfirmChange(e.target.value)}
              disabled={field.readOnly || !value}
              placeholder="Повторите пароль"
              autoComplete="new-password"
              className={`pr-10 ${passwordError ? 'border-destructive' : ''}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? (
                <IconEyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <IconEye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          {passwordError && (
            <p className="text-sm text-destructive mt-1">{passwordError}</p>
          )}
        </div>
      </div>
    )
  }

  if (field.fieldType === 'price') {
    // For price field, check if it's text type (for "по запросу" support)
    const isTextPrice = field.type === 'text';
    const displayValue = priceInputs?.[priceInputKey] !== undefined
      ? priceInputs[priceInputKey]
      : value === undefined || value === null || value === "" || value === 0 || value === "0"
        ? (isTextPrice ? "по запросу" : "")
        : (isTextPrice ? String(value) : Number(value).toFixed(2))

    if (isTextPrice) {
      return (
        <>
          <Label htmlFor={fieldId} className="text-sm font-medium">
            {field.title || field.name}
            {!field.nullable && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id={fieldId}
            type="text"
            required={!field.nullable}
            value={displayValue}
            onChange={(e) => {
              const v = e.target.value
              setPriceInputs?.((prev) => ({ ...prev, [priceInputKey]: v }))
              onChange(v)
            }}
            onBlur={(e) => {
              const v = e.target.value.trim()
              setPriceInputs?.((prev) => ({ ...prev, [priceInputKey]: v || "по запросу" }))
              onChange(v || "по запросу")
            }}
            placeholder="по запросу"
            disabled={field.readOnly}
          />
        </>
      )
    }

    return (
      <>
        <Label htmlFor={fieldId} className="text-sm font-medium">
          {field.title || field.name}
          {!field.nullable && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Input
          id={fieldId}
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          required={!field.nullable}
          value={displayValue}
          onChange={(e) => {
            let v = e.target.value.replace(/,/g, '.')
            setPriceInputs?.((prev) => ({ ...prev, [priceInputKey]: v }))
            if (v.includes('.')) {
              const [i, d] = v.split('.')
              v = `${i}.${d.slice(0, 2)}`
            }
            const num = v === '' ? NaN : Number(v)
            const price = !isFinite(num) ? null : num
            onChange(price)
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
              setPriceInputs?.((prev) => ({ ...prev, [priceInputKey]: formatted }))
              onChange(num)
            }
          }}
          disabled={field.readOnly}
        />
      </>
    )
  }

  if (field.fieldType === 'enum' && field.enum) {
    return (
      <>
        <Label htmlFor={fieldId} className="text-sm font-medium">
          {field.title || field.name}
          {!field.nullable && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Select
          value={value || ""}
          onValueChange={(val) => onChange(val)}
          required={!field.nullable}
          disabled={field.readOnly}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={`Выберите ${field.title || field.name}`} />
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
    )
  }

  if (field.relation) {
    return (
      <>
        <Label htmlFor={fieldId} className="text-sm font-medium">
          {field.title || field.name}
          {!field.nullable && <span className="text-destructive ml-1">*</span>}
        </Label>
        <RelationSelect
          relation={field.relation}
          value={value}
          onChange={(val) => onChange(val)}
          required={!field.nullable}
          disabled={field.readOnly}
          search={search}
        />
      </>
    )
  }

  if (field.textarea) {
    return (
      <>
        <Label htmlFor={fieldId} className="text-sm font-medium">
          {field.title || field.name}
          {!field.nullable && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Textarea
          id={fieldId}
          required={!field.nullable}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={field.readOnly}
          rows={6}
        />
      </>
    )
  }

  if (field.fieldType === 'image') {
    return (
      <>
        <Label htmlFor={fieldId} className="text-sm font-medium">
          {field.title || field.name}
          {!field.nullable && <span className="text-destructive ml-1">*</span>}
        </Label>
        <MediaUpload
          value={value || ''}
          onChange={(val) => onChange(val)}
          disabled={field.readOnly}
        />
      </>
    )
  }

  if (field.fieldType === 'images') {
    return (
      <>
        <Label htmlFor={fieldId} className="text-sm font-medium">
          {field.title || field.name}
          {!field.nullable && <span className="text-destructive ml-1">*</span>}
        </Label>
        <MediaMultiSelect
          value={Array.isArray(value) ? value : []}
          onChange={(val) => onChange(val)}
          disabled={field.readOnly}
        />
      </>
    )
  }

  if (field.fieldType === 'tiptap') {
    return (
      <>
        <Label htmlFor={fieldId} className="text-sm font-medium">
          {field.title || field.name}
          {!field.nullable && <span className="text-destructive ml-1">*</span>}
        </Label>
        <TipTapEditor
          content={value || ''}
          onChange={(content) => onChange(content)}
          placeholder={`Введите ${field.title || field.name}`}
        />
      </>
    )
  }

  // Default: text, number, email
  return (
    <>
      <Label htmlFor={fieldId} className="text-sm font-medium">
        {field.title || field.name}
        {!field.nullable && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={fieldId}
        type={field.fieldType === 'email' ? 'email' : field.fieldType === 'number' ? 'number' : 'text'}
        required={!field.nullable}
        value={value != null && value !== '' ? String(value) : ''}
        onChange={(e) => {
          if (field.fieldType === 'number') {
            const inputValue = e.target.value.trim()
            // Allow empty string (will be converted to null)
            if (inputValue === '') {
              onChange(null)
            } else {
              const num = Number(inputValue)
              // Allow 0 as valid value, only reject NaN
              onChange(isNaN(num) ? null : num)
            }
          } else {
            onChange(e.target.value)
          }
        }}
        disabled={field.readOnly}
        placeholder={`Введите ${field.title || field.name}`}
      />
    </>
  )
}

