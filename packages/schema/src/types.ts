export type FieldType =
  | 'string'
  | 'text'
  | 'richtext'
  | 'number'
  | 'boolean'
  | 'datetime'
  | 'media'
  | 'relation'
  | 'uid'

export type NumberSubtype = 'integer' | 'float'

export type FieldWidth = 'full' | 'half' | 'third'

export interface FieldDefinition {
  name: string
  type: FieldType
  required?: boolean
  subtype?: NumberSubtype   // only for 'number'
  relatedTable?: string     // only for 'relation'
  targetField?: string      // only for 'uid' — source field to derive the slug from
  width?: FieldWidth        // layout width in the entry editor
}

export interface ContentType {
  id?: string
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
