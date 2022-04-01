import { TlEntry, TlErrors, TlFullSchema } from '../types'
import { groupTlEntriesByNamespace, splitNameToNamespace } from '../utils'
import { camelToPascal, indent, jsComment, snakeToCamel } from './utils'
import { errorCodeToClassName, generateCodeForErrors } from './errors'

const PRIMITIVE_TO_TS: Record<string, string> = {
    int: 'number',
    long: 'Long',
    int53: 'number',
    int128: 'Int128',
    int256: 'Int256',
    double: 'Double',
    string: 'string',
    bytes: 'Buffer',
    Bool: 'boolean',
    true: 'boolean',
    null: 'null',
    any: 'any',
}

function fullTypeName(
    type: string,
    baseNamespace: string,
    namespace = true,
    method = false
): string {
    if (type in PRIMITIVE_TO_TS) return PRIMITIVE_TO_TS[type]
    let m
    if ((m = type.match(/^[Vv]ector[< ](.+?)[> ]$/))) {
        return fullTypeName(m[1], baseNamespace) + '[]'
    }

    const [ns, name] = splitNameToNamespace(type)
    let res = baseNamespace
    if (namespace && ns) res += ns + '.'

    if (name[0].match(/[A-Z]/)) {
        res += 'Type'
    } else {
        res += 'Raw'
    }

    res += camelToPascal(name)

    if (method) res += 'Request'

    return res
}

function entryFullTypeName(entry: TlEntry): string {
    return fullTypeName(entry.name, '', false, entry.kind === 'method')
}

export function generateTypescriptDefinitionsForTlEntry(
    entry: TlEntry,
    baseNamespace = 'tl.',
    errors?: TlErrors
): string {
    let ret = ''

    let comment = ''
    if (entry.comment) {
        comment = entry.comment
    }
    if (entry.kind === 'method' && !entry.generics) {
        if (comment) comment += '\n\n'

        comment += `RPC method returns {@see ${fullTypeName(
            entry.type,
            baseNamespace
        )}}`

        if (errors) {
            if (errors.userOnly[entry.name]) {
                comment += `\n\nThis method is **not** available for bots`
            }

            if (errors.throws[entry.name]) {
                comment +=
                    `\n\nThis method *may* throw one of these errors: ` +
                    errors.throws[entry.name]
                        .map((it) => `{$see ${errorCodeToClassName(it)}`)
                        .join(', ')
            }
        }
    }
    if (comment) ret += jsComment(comment) + '\n'

    ret += `interface ${entryFullTypeName(entry)} {\n    _: '${entry.name}';\n`

    const genericsIndex: Record<string, string> = {}
    if (entry.generics) {
        entry.generics.forEach((it) => {
            genericsIndex[it.name] = it.type
        })
    }

    entry.arguments.forEach((arg) => {
        if (arg.type === '#') return

        if (arg.comment) {
            ret += indent(4, jsComment(arg.comment)) + '\n'
        }

        ret += `    ${snakeToCamel(arg.name)}`

        if (arg.predicate) ret += '?'

        let type = arg.type
        let typeFinal = false

        if (type[0] === '!') type = type.substr(1)

        if (type in genericsIndex) {
            type = genericsIndex[type]

            if (type === 'Type') {
                type = 'any'
                typeFinal = true
            }
        }

        if (!typeFinal) type = fullTypeName(arg.type, baseNamespace)

        ret += `: ${type};\n`
    })

    ret += '}'

    return ret
}

const PRELUDE = `
import _Long from 'long';

export declare namespace $NS$ {
    const LAYER = $LAYER$;

    function $extendTypes(types: Record<string, string>): void

    type Long = _Long;
    type RawLong = Buffer;
    type Int128 = Buffer;
    type Int256 = Buffer;
    type Double = number;

    type FindByName<T extends { _: string }, Name extends T['_']> = Extract<T, { _: Name }>

    type Mutable<T> = {
        -readonly [P in keyof T]: T[P]
    }
`

const PRELUDE_JS = `
exports.$NS$ = {};
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
ns.LAYER = $LAYER$;
`

// returns pair of generated ts and js code
export function generateTypescriptDefinitionsForTlSchema(
    schema: TlFullSchema,
    layer: number,
    namespace = 'tl',
    errors?: TlErrors
): [string, string] {
    let ts = PRELUDE.replace('$NS$', namespace).replace('$LAYER$', layer + '')
    let js = PRELUDE_JS.replace('$NS$', namespace).replace(
        '$LAYER$',
        layer + ''
    )

    if (errors) {
        ts += `\n    namespace errors {\n`
        js += `ns.errors = {};\n(function(ns){\n`

        const [_ts, _js] = generateCodeForErrors(errors, 'ns.')
        ts += indent(8, _ts)
        js += _js

        ts += `}\n`
        js += `})(ns.errors);\n`
    }

    const namespaces = groupTlEntriesByNamespace(schema.entries)

    for (const ns in namespaces) {
        if (!namespaces.hasOwnProperty(ns)) continue

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

            ts +=
                indent(
                    indentSize,
                    generateTypescriptDefinitionsForTlEntry(
                        entry,
                        namespace + '.'
                    )
                ) + '\n'
        })

        ts += indent(indentSize, 'interface RpcCallReturn')
        if (ns === '') {
            let first = true
            for (const ns in namespaces) {
                if (!namespaces.hasOwnProperty(ns)) continue
                if (ns === '') continue

                if (first) {
                    first = false
                    ts += ' extends '
                } else {
                    ts += ', '
                }

                ts += ns + '.RpcCallReturn'
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
                        type =
                            g.type === 'Type'
                                ? 'any'
                                : fullTypeName(g.type, namespace + '.')
                        break
                    }
                }
            }

            if (!type) {
                type = fullTypeName(entry.type, namespace + '.')
            }

            ts += indent(indentSize + 4, `'${entry.name}': ${type}`) + '\n'
        })

        ts += indent(indentSize, '}') + '\n'

        if (ns) {
            js += `ns.${ns} = {};\n(function(ns){\n`
        }

        for (const name in unions) {
            if (!unions.hasOwnProperty(name)) continue

            const union = schema.unions[name]

            if (union.comment) {
                ts += indent(indentSize, jsComment(union.comment)) + '\n'
            }
            const typeName = fullTypeName(name, '', false)
            const typeWithoutNs = typeName.substring(4)
            ts += indent(indentSize, `type ${typeName} = `)

            union.classes.forEach((entry, idx) => {
                if (idx !== 0) ts += ' | '
                ts += fullTypeName(entry.name, namespace + '.')
            })

            ts += '\n'

            ts +=
                indent(
                    indentSize,
                    `function isAny${typeWithoutNs}(o: object): o is ${typeName}`
                ) + '\n'
            js += `ns.isAny${typeWithoutNs} = _isAny('${name}');\n`
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
        if (!schema.methods.hasOwnProperty(name)) continue

        if (first) {
            ts += indent(4, 'type RpcMethod =') + '\n'
            first = false
        }

        const entry = schema.methods[name]
        ts +=
            indent(
                8,
                '| ' + fullTypeName(entry.name, namespace + '.', true, true)
            ) + '\n'
    }

    ts += '\n' + indent(4, 'type TlObject =') + '\n'

    const _types: Record<string, string> = {}

    schema.entries.forEach((entry) => {
        if (entry.kind === 'class') {
            _types[entry.name] = entry.type
        }

        ts +=
            indent(
                8,
                '| ' +
                    fullTypeName(
                        entry.name,
                        namespace + '.',
                        true,
                        entry.kind === 'method'
                    )
            ) + '\n'
    })

    ts += '}'

    js += `_types = JSON.parse('${JSON.stringify(_types)}');\n`
    js += `})(exports.${namespace});`

    return [ts, js]
}
