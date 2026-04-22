export type FieldType =
  | 'string'
  | 'text'
  | 'richtext'
  | 'number'
  | 'boolean'
  | 'datetime'
  | 'media'
  | 'relation'

export type NumberSubtype = 'integer' | 'float'

export interface FieldDefinition {
  name: string
  type: FieldType
  required?: boolean
  subtype?: NumberSubtype   // only for 'number'
  relatedTable?: string     // only for 'relation'
}

export interface ContentType {
  id?: number
  name: string
  slug: string
  tableName: string
  fields: FieldDefinition[]
  createdAt?: Date
  updatedAt?: Date
}

export class ValidationError extends Error {
  constructor(public readonly errors: string[]) {
    super(errors.join(', '))
    this.name = 'ValidationError'
  }
}

export class SchemaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SchemaError'
  }
}
