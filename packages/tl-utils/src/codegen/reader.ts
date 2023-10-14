import { computeConstructorIdFromEntry } from '../ctor-id.js'
import { TL_PRIMITIVES, TlEntry } from '../types.js'
import { snakeToCamel } from './utils.js'

export interface ReaderCodegenOptions {
    /**
     * Whether to include `flags` field in the result object
     * @default false
     */
    includeFlags?: boolean

    /**
     * Name of the variable to use for the readers map
     * @default 'm'
     */
    variableName?: string

    /**
     * Whether to include methods in the readers map
     */
    includeMethods?: boolean

    /**
     * Whether to include `._results` field in the result object,
     * containing a map of methods names to their result readers.
     *
     * Requires `parseMethodTypes` to be `true` when parsing the TL schema.
     *
     * **Note**: will only work for primitives and vectors of primitives
     */
    includeMethodResults?: boolean
}

const DEFAULT_OPTIONS: ReaderCodegenOptions = {
    includeFlags: false,
    variableName: 'm',
    includeMethods: false,
    includeMethodResults: false,
}

/**
 * Generate binary reader code for a given entry.
 *
 * @param entry  Entry to generate reader for
 * @param params  Options
 * @returns  Code as a writers map entry
 */
export function generateReaderCodeForTlEntry(entry: TlEntry, params = DEFAULT_OPTIONS): string {
    const { variableName, includeFlags } = { ...DEFAULT_OPTIONS, ...params }

    if (entry.id === 0) entry.id = computeConstructorIdFromEntry(entry)

    const pre = `${entry.id}:function(r){`

    if (!entry.arguments.length) {
        return pre + `return{_:'${entry.name}'}},`
    }

    let beforeReturn = ''
    let returnCode = `_:'${entry.name}',`

    const flagsFields: Record<string, 1> = {}
    let lastFlagIdx = -1

    entry.arguments.forEach((arg, idx) => {
        if (arg.type === '#') {
            lastFlagIdx = idx
            flagsFields[arg.name] = 1
        }
    })

    entry.arguments.forEach((arg, idx) => {
        if (arg.type === '#') {
            beforeReturn += `var ${arg.name}=r.uint();`

            if (includeFlags) {
                returnCode += `${arg.name}:${arg.name},`
            }

            return
        }

        const isBeforeLastFlag = lastFlagIdx > idx

        const argName = snakeToCamel(arg.name)

        if (arg.typeModifiers?.predicate) {
            const predicate = arg.typeModifiers.predicate
            const s = predicate.split('.')
            const fieldName = s[0]
            const bitIndex = parseInt(s[1])

            if (!(fieldName in flagsFields)) {
                throw new Error(`Invalid predicate: ${predicate} - unknown field (in ${entry.name})`)
            }
            if (isNaN(bitIndex) || bitIndex < 0 || bitIndex > 32) {
                throw new Error(`Invalid predicate: ${predicate} - invalid bit`)
            }

            const condition = `${fieldName}&${1 << bitIndex}`

            if (arg.type === 'true') {
                returnCode += `${argName}:!!(${condition}),`

                return
            }

            if (isBeforeLastFlag) {
                beforeReturn += `var ${argName}=${condition}?`
                returnCode += `${argName}:${argName},`
            } else {
                returnCode += `${argName}:${condition}?`
            }
        } else if (isBeforeLastFlag) {
            beforeReturn += `var ${argName}=`
            returnCode += `${argName}:${argName},`
        } else {
            returnCode += `${argName}:`
        }

        let type = arg.type

        if (type in TL_PRIMITIVES) {
            if (type === 'Bool' || type === 'bool') type = 'boolean'
        } else {
            type = 'object'
        }

        let reader = `r.${type}`
        const isBare = arg.typeModifiers?.isBareType || arg.typeModifiers?.isBareUnion

        if (isBare) {
            if (!arg.typeModifiers?.constructorId) {
                throw new Error(`Cannot generate reader for ${entry.name}#${arg.name} - no constructor id referenced`)
            }

            reader = `${variableName}[${arg.typeModifiers.constructorId}]`
        }

        let code

        if (arg.typeModifiers?.isVector) {
            code = `r.vector(${reader})`
        } else if (arg.typeModifiers?.isBareVector) {
            code = `r.vector(${reader},1)`
        } else {
            code = `${reader}(${isBare ? 'r' : ''})`
        }

        if (arg.typeModifiers?.predicate) {
            code += ':void 0'
        }

        if (isBeforeLastFlag) {
            beforeReturn += code + ';'
        } else {
            returnCode += code + ','
        }
    })

    return `${pre}${beforeReturn.replace(/;var /g, ',')}return{${returnCode}}},`
}

/**
 * Generate binary reader code for a given schema.
 *
 * @param entries  Entries to generate reader for
 * @param params  Codegen options
 */
export function generateReaderCodeForTlEntries(entries: TlEntry[], params = DEFAULT_OPTIONS): string {
    const { variableName, includeMethods } = { ...DEFAULT_OPTIONS, ...params }
    let ret = `var ${variableName}={\n`

    entries.forEach((entry) => {
        if (entry.kind === 'method' && !includeMethods) return

        ret += generateReaderCodeForTlEntry(entry, params) + '\n'
    })

    const usedInBareVector: Record<string, 1> = {}
    ret.replace(new RegExp(`(?<=r\\.vector\\(${variableName}\\[)(\\d+)(?=])`, 'g'), (_, id: string) => {
        usedInBareVector[id] = 1

        return _
    })

    for (const id of Object.keys(usedInBareVector)) {
        ret = ret.replace(new RegExp(`(?<=^${id}:function\\()r(?=\\))`, 'gm'), 'r=this')
    }

    if (params.includeMethodResults) {
        ret += '_results:{\n'

        entries.forEach((entry) => {
            if (entry.kind !== 'method') return

            const pre = `'${entry.name}':function(r){return `

            const isVector = entry.typeModifiers?.isVector || entry.typeModifiers?.isBareVector
            const post = entry.typeModifiers?.isBareVector ? ',1' : ''

            if (entry.type in TL_PRIMITIVES) {
                const type = entry.type
                // booleans can be properly parsed as they have own constructor ids
                if (type === 'Bool' || type === 'bool') return

                if (isVector) {
                    ret += `${pre}r.vector(r.${type}${post})},\n`
                } else {
                    ret += `${pre}r.${type}()},\n`
                }
            }
        })

        ret += '},\n'
    }

    return ret + '}'
}
