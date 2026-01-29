export type ColumnSchema = {
  name: string
  type: string
  nullable: boolean
  primary: boolean
}

export type RelationConfig = {
  collection: string
  valueField: string
  labelField: string
  labelFields?: string[]
  filters?: any[]
  inheritSearch?: boolean
  multiple?: boolean
}

export type ColumnSchemaExtended = ColumnSchema & {
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

export type CollectionData = Record<string, any>

