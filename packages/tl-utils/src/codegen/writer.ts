import { computeConstructorIdFromEntry } from '../ctor-id'
import { TL_PRIMITIVES, TlEntry } from '../types'
import { snakeToCamel } from './utils'

export interface WriterCodegenOptions {
    /**
     * Whether to use `flags` field from the input
     * @default false
     */
    includeFlags?: boolean

    /**
     * Name of the variable to use for the writers map
     * @default 'm'
     */
    variableName?: string

    /**
     * Whether to include prelude code (function `h`)
     */
    includePrelude?: boolean

    /**
     * Whether to generate bare writer (without constructor id write)
     */
    bare?: boolean
}

const DEFAULT_OPTIONS: WriterCodegenOptions = {
    includeFlags: false,
    variableName: 'm',
    includePrelude: true,
    bare: false,
}

const TL_WRITER_PRELUDE =
    'function h(o,p){' +
    'var q=o[p];' +
    'if(q===void 0)' +
    "throw Error('Object '+o._+' is missing required property '+p);" +
    'return q}\n'

/**
 * Generate writer code for a single entry.
 * `h` (has) function from the prelude should be available
 *
 * @param entry  Entry to generate writer for
 * @param params  Options
 * @returns  Code as a readers map entry
 */
export function generateWriterCodeForTlEntry(
    entry: TlEntry,
    params = DEFAULT_OPTIONS,
): string {
    const { bare, includeFlags, variableName } = {
        ...DEFAULT_OPTIONS,
        ...params,
    }

    if (entry.id === 0) entry.id = computeConstructorIdFromEntry(entry)

    const name = bare ? entry.id : `'${entry.name}'`
    const defaultWriter = bare ? '=this' : ''
    let ret = `${name}:function(w${defaultWriter}${
        entry.arguments.length ? ',v' : ''
    }){`

    if (!bare) ret += `w.uint(${entry.id});`

    const flagsFields: Record<string, 1> = {}

    entry.arguments.forEach((arg) => {
        if (arg.type === '#') {
            ret += `var ${arg.name}=${includeFlags ? `v.${arg.name}` : '0'};`

            entry.arguments.forEach((arg1) => {
                const predicate = arg1.typeModifiers?.predicate

                let s

                if (!predicate || (s = predicate.split('.'))[0] !== arg.name) {
                    return
                }

                const arg1Name = snakeToCamel(arg1.name)

                const bitIndex = parseInt(s[1])

                if (isNaN(bitIndex) || bitIndex < 0 || bitIndex > 32) {
                    throw new Error(
                        `Invalid predicate: ${predicate} - invalid bit`,
                    )
                }

                const action = `${arg.name}|=${1 << bitIndex};`

                if (arg1.type === 'true') {
                    ret += `if(v.${arg1Name}===true)${action}`
                } else if (
                    arg1.typeModifiers?.isVector ||
                    arg1.typeModifiers?.isBareVector
                ) {
                    ret += `var _${arg1Name}=v.${arg1Name}&&v.${arg1Name}.length;if(_${arg1Name})${action}`
                } else {
                    ret += `var _${arg1Name}=v.${arg1Name}!==undefined;if(_${arg1Name})${action}`
                }
            })

            ret += `w.uint(${arg.name});`
            flagsFields[arg.name] = 1

            return
        }

        const argName = snakeToCamel(arg.name)

        let type = arg.type

        let accessor = `v.${argName}`

        if (arg.typeModifiers?.predicate) {
            if (type === 'true') return // included in flags

            ret += `if(_${argName})`
        } else {
            accessor = `h(v,'${argName}')`
        }

        if (type in TL_PRIMITIVES) {
            if (type === 'Bool') type = 'boolean'
        } else {
            type = 'object'
        }

        let writer = `w.${type}`
        const isBare =
            arg.typeModifiers?.isBareType || arg.typeModifiers?.isBareUnion

        if (isBare) {
            if (!arg.typeModifiers?.constructorId) {
                throw new Error(
                    `Cannot generate writer for ${entry.name}#${arg.name} - no constructor id referenced`,
                )
            }

            writer = `${variableName}._bare[${arg.typeModifiers.constructorId}]`
        }

        if (arg.typeModifiers?.isVector) {
            ret += `w.vector(${writer},${accessor});`
        } else if (arg.typeModifiers?.isBareVector) {
            ret += `w.vector(${writer},${accessor},1);`
        } else {
            ret += `${writer}(${isBare ? 'w,' : ''}${accessor});`
        }
    })

    return ret + '},'
}

/**
 * Generate writer code for a given TL schema.
 *
 * @param entries  Entries to generate writers for
 * @param params  Codegen options
 */
export function generateWriterCodeForTlEntries(
    entries: TlEntry[],
    params = DEFAULT_OPTIONS,
): string {
    const { includePrelude, variableName } = { ...DEFAULT_OPTIONS, ...params }

    let ret = ''
    if (includePrelude) ret += TL_WRITER_PRELUDE
    ret += `var ${variableName}={\n`

    const usedAsBareIds: Record<number, 1> = {}
    entries.forEach((entry) => {
        ret += generateWriterCodeForTlEntry(entry, params) + '\n'

        entry.arguments.forEach((arg) => {
            if (arg.typeModifiers?.constructorId) {
                usedAsBareIds[arg.typeModifiers.constructorId] = 1
            }
        })
    })

    if (Object.keys(usedAsBareIds).length) {
        ret += '_bare:{\n'

        Object.keys(usedAsBareIds).forEach((id) => {
            const entry = entries.find((e) => e.id === parseInt(id))

            if (!entry) {
                return
            }

            ret +=
                generateWriterCodeForTlEntry(entry, {
                    ...params,
                    bare: true,
                }) + '\n'
        })
        ret += '}'
    }

    return ret + '}'
}
