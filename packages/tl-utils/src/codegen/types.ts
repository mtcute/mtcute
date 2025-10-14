import type { TlEntry, TlErrors, TlFullSchema, TlTypeModifiers } from '../types.js'
import { groupTlEntriesByNamespace, splitNameToNamespace } from '../utils.js'

import { generateCodeForErrors } from './errors.js'
import { camelToPascal, indent, jsComment, snakeToCamel } from './utils.js'

/**
 * Mapping of TL primitive types to TS types
 */
export const PRIMITIVE_TO_TS: Record<string, string> = {
    int: 'number',
    long: 'Long',
    int53: 'number',
    int128: 'Int128',
    int256: 'Int256',
    double: 'Double',
    string: 'string',
    bytes: 'Uint8Array',
    Bool: 'boolean',
    true: 'boolean',
    null: 'null',
    any: 'any',
    boolFalse: 'false',
    boolTrue: 'true',
}

function fullTypeName(
    type: string,
    baseNamespace: string,
    {
        namespace = true,
        method = false,
        link = false,
        typeModifiers,
    }: {
        namespace?: boolean
        method?: boolean
        link?: boolean
        typeModifiers?: TlTypeModifiers
    } = {},
): string {
    if (typeModifiers) {
        const inner = fullTypeName(type, baseNamespace, {
            namespace,
            method,
            link,
        })

        if (typeModifiers.isVector || typeModifiers.isBareVector) {
            if (link) return `${inner} array`

            return `${inner}[]`
        }
    }
    if (type in PRIMITIVE_TO_TS) return PRIMITIVE_TO_TS[type]

    const [ns, name] = splitNameToNamespace(type)
    let res = baseNamespace
    if (namespace && ns) res += `${ns}.`

    if (name[0].match(/[A-Z]/)) {
        res += 'Type'
    } else {
        res += 'Raw'
    }

    res += camelToPascal(name)

    if (method) res += 'Request'

    if (link) res = `{@link ${res}}`

    return res
}

function entryFullTypeName(entry: TlEntry): string {
    return fullTypeName(entry.name, '', {
        namespace: false,
        method: entry.kind === 'method',
    })
}

/**
 * Generate TypeScript definitions for a given entry
 *
 * @param entry  Entry to generate definitions for
 * @param baseNamespace  Base TL namespace containing the entries
 * @param errors  Errors information object
 * @param withFlags  Whether to include `flags` field in the type
 */
export function generateTypescriptDefinitionsForTlEntry(
    entry: TlEntry,
    params?: {
        baseNamespace?: string
        errors?: TlErrors
        withFlags?: boolean
        extends?: {
            ownSchema: TlFullSchema
            namespace: string
        }
    },
): string {
    const { baseNamespace = 'tl.', errors, withFlags = false, extends: extendsSchema } = params ?? {}
    let ret = ''

    let comment = ''

    if (entry.comment) {
        comment = entry.comment
    }
    if (entry.kind === 'method' && !entry.generics) {
        if (comment) comment += '\n\n'

        comment += `RPC method returns ${fullTypeName(entry.type, baseNamespace, {
            link: true,
            typeModifiers: entry.typeModifiers,
        })}`

        if (errors) {
            if (errors.userOnly[entry.name]) {
                comment += '\n\nThis method is **not** available for bots'
            } else if (errors.botOnly[entry.name]) {
                comment += '\n\nThis method is **not** available for normal users'
            }

            if (errors.throws[entry.name]) {
                comment += `\n\nThis method *may* throw one of these errors: ${errors.throws[entry.name].join(', ')}`
            }
        }
    }
    if (comment) ret += `${jsComment(comment)}\n`

    let genericsString = ''
    const genericsIndex: Record<string, 1> = {}

    if (entry.generics?.length) {
        genericsString = '<'
        entry.generics.forEach((it, idx) => {
            /* c8 ignore next 3 */
            if (it.type !== 'Type') {
                throw new Error('Only Type generics are supported')
            }

            const tsType = `${baseNamespace}TlObject`

            genericsIndex[it.name] = 1

            /* c8 ignore next 3 */
            if (idx !== 0) {
                throw new Error('Multiple generics are not supported')
            }

            genericsString += `${it.name} extends ${tsType} = ${tsType}`
        })
        genericsString += '>'
    }

    ret += `interface ${entryFullTypeName(entry)}${genericsString} {\n    _: '${entry.name}';\n`

    entry.arguments.forEach((arg) => {
        if (arg.type === '#') {
            if (withFlags) {
                ret += `    ${arg.name}: number;\n`
            }

            return
        }

        if (arg.comment) {
            ret += `${indent(4, jsComment(arg.comment))}\n`
        }

        ret += `    ${snakeToCamel(arg.name)}`

        if (arg.typeModifiers?.predicate) ret += '?'

        let type = arg.type
        let typeFinal = false

        if (type[0] === '!') type = type.substring(1)

        if (type in genericsIndex) {
            typeFinal = true
        }

        let typeNamespace = baseNamespace

        if (extendsSchema) {
            // ensure this type is defined in our schema, otherwise we should use the base schema namespace
            const { ownSchema, namespace } = extendsSchema
            const exists = arg.type[0].match(/[A-Z]/) ? arg.type in ownSchema.unions : arg.type in ownSchema.classes
            if (!exists) {
                typeNamespace = `${namespace}.`
            }
        }

        if (!typeFinal) {
            type = fullTypeName(arg.type, typeNamespace, {
                typeModifiers: arg.typeModifiers,
            })
        }

        ret += `: ${type};\n`
    })

    ret += '}'

    return ret
}

/**
 * Generate TypeScript definitions for a given TL schema
 *
 * @param schema  TL schema to generate definitions for
 * @returns  Tuple containing `[ts, js]` code
 */
export function generateTypescriptDefinitionsForTlSchema(
    schema: TlFullSchema,
    params?: {
        /** Layer of the schema */
        layer?: number
        /** Namespace of the schema */
        namespace?: string
        /** Errors information object */
        errors?: TlErrors
        /** Whether to skip importing _Long */
        skipLongImport?: boolean
        /** Whether to only generate typings and don't emit any JS helper functions typings */
        onlyTypings?: boolean
        /** Namespace of another schema that this one extends */
        extends?: string
        /** Schema that this one extends */
        extendsSchema?: TlFullSchema
    },
): [string, string] {
    const {
        layer = 0,
        namespace = 'tl',
        errors,
        skipLongImport = false,
        onlyTypings = false,
        extends: extendsNamespace,
        extendsSchema,
    } = params ?? {}
    let ts = `${skipLongImport ? '' : 'import _Long from \'long\';'}
export declare namespace ${namespace} {
    const LAYER = ${layer};

    ${onlyTypings ? '' : 'function $extendTypes(types: Record<string, string>): void'}

    type Long = _Long;
    type RawLong = Uint8Array;
    type Int128 = Uint8Array;
    type Int256 = Uint8Array;
    type Double = number;

    type FindByName<T extends { _: string }, Name extends T['_']> = Extract<T, { _: Name }>

    type Mutable<T> = {
        -readonly [P in keyof T]: T[P]
    }
`

    let js = `exports.${namespace} = {};
(function(ns) {
var _types = void 0;
function _isAny(type) {
    return function (obj) {
        return typeof obj === 'object' && obj && _types[obj._] == type
    }
}
ns.$extendTypes = function(types) {
    for (var i in types) {
        types.hasOwnProperty(i) && (_types[i] = types[i])
    }
}
ns.LAYER = ${layer};
`

    if (extendsNamespace && !extendsSchema) {
        ts += '    type AnyToNever<T> = any extends T ? never : T;\n'
    }

    if (errors) {
        const [_ts, _js] = generateCodeForErrors(errors, 'ns.')
        ts += _ts
        js += _js
    }

    const namespaces = groupTlEntriesByNamespace(schema.entries)

    for (const ns in namespaces) {
        const entries = namespaces[ns]
        const indentSize = ns === '' ? 4 : 8

        const unions: Record<string, 1> = {}

        if (ns !== '') {
            ts += `\n    namespace ${ns} {\n`
        }

        entries.forEach((entry) => {
            if (entry.kind === 'class') {
                unions[entry.type] = 1
            }

            ts += `${indent(indentSize, generateTypescriptDefinitionsForTlEntry(entry, {
                baseNamespace: `${namespace}.`,
                extends: extendsNamespace
                    ? {
                        ownSchema: schema,
                        namespace: extendsNamespace,
                    }
                    : undefined,
            }))}\n`
        })

        ts += indent(indentSize, 'interface RpcCallReturn')

        if (ns === '') {
            let first = true

            for (const ns in namespaces) {
                if (ns === '') continue

                if (first) {
                    first = false
                    ts += ' extends '
                } else {
                    ts += ', '
                }

                ts += `${ns}.RpcCallReturn`
            }
        }
        ts += ' {\n'

        entries.forEach((entry) => {
            if (entry.kind !== 'method') return

            let type

            if (entry.generics) {
                for (let i = 0; i < entry.generics.length; i++) {
                    const g = entry.generics[i]

                    if (g.name === entry.type) {
                        type = g.type === 'Type' ? 'any' : fullTypeName(g.type, `${namespace}.`)
                        break
                    }
                }
            }

            if (!type) {
                type = fullTypeName(entry.type, `${namespace}.`, {
                    typeModifiers: entry.typeModifiers,
                })
            }

            ts += `${indent(indentSize + 4, `'${entry.name}': ${type}`)}\n`
        })

        ts += `${indent(indentSize, '}')}\n`

        if (ns) {
            js += `ns.${ns} = {};\n(function(ns){\n`
        }

        for (const name in unions) {
            const union = schema.unions[name]

            if (union.comment) {
                ts += `${indent(indentSize, jsComment(union.comment))}\n`
            }
            const typeName = fullTypeName(name, '', { namespace: false })
            const typeWithoutNs = typeName.substring(4)
            ts += indent(indentSize, `type ${typeName} = `)

            union.classes.forEach((entry, idx) => {
                if (idx !== 0) ts += ' | '
                ts += fullTypeName(entry.name, `${namespace}.`)
            })

            if (extendsNamespace && !extendsSchema) {
                ts += ` | AnyToNever<${extendsNamespace}.${typeName}>`
            } else if (extendsSchema && name in extendsSchema.unions) {
                ts += ` | ${extendsNamespace}.${typeName}`
            }

            ts += '\n'

            if (!onlyTypings) {
                ts += `${indent(indentSize, `function isAny${typeWithoutNs}(o: object): o is ${typeName}`)}\n`
                js += `ns.isAny${typeWithoutNs} = _isAny('${name}');\n`
            }
        }

        if (ns) {
            js += `})(ns.${ns});\n`
        }

        if (ns !== '') {
            ts += '}\n'
        }
    }

    let first = true

    for (const name in schema.methods) {
        if (first) {
            ts += `${indent(4, 'type RpcMethod =')}\n`
            first = false
        }

        const entry = schema.methods[name]
        ts += `${indent(8, `| ${fullTypeName(entry.name, `${namespace}.`, { method: true })}`)}\n`
    }

    ts += `\n${indent(4, 'type TlObject =')}\n`

    const _types: Record<string, string> = {}

    schema.entries.forEach((entry) => {
        if (entry.kind === 'class') {
            _types[entry.name] = entry.type
        }

        ts
            += `${indent(
                8,
                `| ${
                    fullTypeName(entry.name, `${namespace}.`, {
                        method: entry.kind === 'method',
                    })}`,
            )}\n`
    })
    if (extendsNamespace) {
        ts += `${indent(8, `| ${extendsNamespace}.TlObject`)}\n`
    }

    ts += '}'

    js += `_types = JSON.parse('${JSON.stringify(_types)}');\n`
    js += `})(exports.${namespace});`

    return [ts, js]
}
