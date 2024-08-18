import { calculateStaticSizes } from '../calculator.js'
import { computeConstructorIdFromEntry } from '../ctor-id.js'
import type { TlArgument, TlEntry } from '../types.js'
import { TL_PRIMITIVES } from '../types.js'

import { snakeToCamel } from './utils.js'

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
     * Whether to include `_staticSize` field
     */
    includeStaticSizes?: boolean

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
    includeStaticSizes: false,
}

const TL_WRITER_PRELUDE
    = 'function h(o,p){'
    + 'var q=o[p];'
    + 'if(q===void 0)'
    + "throw Error('Object '+o._+' is missing required property '+p);"
    + 'return q}\n'

/**
 * Generate writer code for a single entry.
 * `h` (has) function from the prelude should be available
 *
 * @param entry  Entry to generate writer for
 * @param params  Options
 * @returns  Code as a readers map entry
 */
export function generateWriterCodeForTlEntry(entry: TlEntry, params: WriterCodegenOptions = DEFAULT_OPTIONS): string {
    const { bare, includeFlags, variableName } = {
        ...DEFAULT_OPTIONS,
        ...params,
    }

    if (entry.id === 0) entry.id = computeConstructorIdFromEntry(entry)

    const name = bare ? entry.id : `'${entry.name}'`
    const defaultWriter = bare ? '=this' : ''
    let ret = `${name}:function(w${defaultWriter}${entry.arguments.length ? ',v' : ''}){`

    if (!bare) ret += `w.uint(${entry.id});`

    const flagsFields: Record<string, 1> = {}
    const fieldConditions: Record<string, string> = {}

    entry.arguments.forEach((arg) => {
        if (arg.type === '#') {
            ret += `var ${arg.name}=${includeFlags ? `v.${arg.name}` : '0'};`

            const usedByArgs = entry.arguments.filter(a => a.typeModifiers?.predicate?.startsWith(`${arg.name}.`))
            const indexUsage: Record<string, TlArgument[]> = {}

            usedByArgs.forEach((arg1) => {
                const index = arg1.typeModifiers!.predicate!.split('.')[1]
                if (!indexUsage[index]) indexUsage[index] = []
                indexUsage[index].push(arg1)
            })

            Object.entries(indexUsage).forEach(([index, args]) => {
                const bitIndex = Number.parseInt(index)

                if (Number.isNaN(bitIndex) || bitIndex < 0 || bitIndex > 32) {
                    throw new Error(`Invalid predicate: ${arg.name}.${bitIndex} - invalid bit`)
                }

                const conditions: string[] = []
                args.forEach((arg1) => {
                    const arg1Name = snakeToCamel(arg1.name)

                    if (arg1.type === 'true') {
                        conditions.push(`v.${arg1Name}===true`)
                    } else if (arg1.typeModifiers?.isVector || arg1.typeModifiers?.isBareVector) {
                        ret += `var _${arg1Name}=v.${arg1Name}&&v.${arg1Name}.length;`
                        conditions.push(`_${arg1Name}`)
                    } else {
                        ret += `var _${arg1Name}=v.${arg1Name}!==undefined;`
                        conditions.push(`_${arg1Name}`)
                    }
                })

                const action = `${arg.name}|=${1 << bitIndex};`
                let condition: string

                if (conditions.length > 1) {
                    condition = `_${arg.name}_${bitIndex}`
                    ret += `var ${condition}=${conditions.join('||')};`
                } else {
                    condition = conditions[0]
                }

                ret += `if(${condition})${action}`

                args.forEach((arg) => {
                    fieldConditions[arg.name] = condition
                })
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

            ret += `if(${fieldConditions[arg.name]})`
        } else {
            accessor = `h(v,'${argName}')`
        }

        if (type in TL_PRIMITIVES) {
            if (type === 'Bool') type = 'boolean'
        } else {
            type = 'object'
        }

        let writer = `w.${type}`
        const isBare = arg.typeModifiers?.isBareType || arg.typeModifiers?.isBareUnion

        if (isBare) {
            if (!arg.typeModifiers?.constructorId) {
                throw new Error(`Cannot generate writer for ${entry.name}#${arg.name} - no constructor id referenced`)
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

    return `${ret}},`
}

/**
 * Generate writer code for a given TL schema.
 *
 * @param entries  Entries to generate writers for
 * @param params  Codegen options
 */
export function generateWriterCodeForTlEntries(
    entries: TlEntry[],
    params: WriterCodegenOptions = DEFAULT_OPTIONS,
): string {
    const { includePrelude, variableName, includeStaticSizes } = {
        ...DEFAULT_OPTIONS,
        ...params,
    }

    let ret = ''
    if (includePrelude) ret += TL_WRITER_PRELUDE
    ret += `var ${variableName}={\n`

    const usedAsBareIds: Record<number, 1> = {}
    entries.forEach((entry) => {
        ret += `${generateWriterCodeForTlEntry(entry, params)}\n`

        entry.arguments.forEach((arg) => {
            if (arg.typeModifiers?.constructorId) {
                usedAsBareIds[arg.typeModifiers.constructorId] = 1
            }
        })
    })

    if (Object.keys(usedAsBareIds).length) {
        ret += '_bare:{\n'

        Object.keys(usedAsBareIds).forEach((id) => {
            const entry = entries.find(e => e.id === Number.parseInt(id))!

            ret
                += `${generateWriterCodeForTlEntry(entry, {
                    ...params,
                    bare: true,
                })}\n`
        })
        ret += '},\n'
    }

    if (includeStaticSizes) {
        ret += '_staticSize:{\n'

        const staticSizes = calculateStaticSizes(entries)

        Object.keys(staticSizes).forEach((name) => {
            ret += `'${name}':${staticSizes[name]},\n`
        })

        ret += '},\n'
    }

    return `${ret}}`
}
