function assertObject(obj: object): asserts obj is object {
  if (typeof obj !== 'object' || obj === null) {
    throw new Error('Expected object')
  }
}

interface TypeofToType {
  string: string
  number: number
  boolean: boolean
  object: object
}

function assertFieldType<Field extends string, Type extends keyof TypeofToType>(
  obj: object,
  field: Field,
  type: Type,
): asserts obj is { [K in Field]: TypeofToType[Type] } {
  const typeof_ = typeof (obj as any)[field]

  if (typeof_ !== type) {
    throw new Error(`Expected field ${field} to be of type ${type} (got ${typeof_})`)
  }
}

export interface TlParamJson {
  name: string
  type: string
}

export function parseTlParamFromJson(obj: object): TlParamJson {
  assertObject(obj)
  assertFieldType(obj, 'name', 'string')
  assertFieldType(obj, 'type', 'string')

  return obj
}

function assertFieldParams(obj: object): asserts obj is { params: TlParamJson[] } {
  assertFieldType(obj, 'params', 'object')

  if (!Array.isArray(obj.params)) {
    throw new TypeError('Expected field params to be an array')
  }

  obj.params.forEach(parseTlParamFromJson) // will throw if invalid
}

export interface TlConstructorJson {
  id: string
  type: string
  predicate: string
  params: TlParamJson[]
}

export function parseTlConstructorFromJson(obj: object): TlConstructorJson {
  assertObject(obj)
  assertFieldType(obj, 'id', 'string')
  assertFieldType(obj, 'type', 'string')
  assertFieldType(obj, 'predicate', 'string')
  assertFieldParams(obj)

  return obj
}

export interface TlMethodJson {
  id: string
  type: string
  method: string
  params: TlParamJson[]
}

export function parseTlMethodFromJson(obj: object): TlMethodJson {
  assertObject(obj)
  assertFieldType(obj, 'id', 'string')
  assertFieldType(obj, 'type', 'string')
  assertFieldType(obj, 'method', 'string')
  assertFieldParams(obj)

  return obj
}

export interface TlSchemaJson {
  constructors: TlConstructorJson[]
  methods: TlMethodJson[]
}

export function parseTlSchemaFromJson(obj: object): TlSchemaJson {
  assertObject(obj)

  assertFieldType(obj, 'constructors', 'object')
  assertFieldType(obj, 'methods', 'object')

  if (!Array.isArray(obj.constructors)) {
    throw new TypeError('Expected field constructors to be an array')
  }

  if (!Array.isArray(obj.methods)) {
    throw new TypeError('Expected field methods to be an array')
  }

  obj.constructors.forEach(parseTlConstructorFromJson) // will throw if invalid
  obj.methods.forEach(parseTlMethodFromJson) // will throw if invalid

  return obj as TlSchemaJson
}
