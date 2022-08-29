import { TL_PRIMITIVES, TlEntry } from '../types'
import { computeConstructorIdFromEntry } from '../ctor-id'
import { snakeToCamel } from './utils'

/**
 * Generate binary reader code for a given entry.
 *
 * @param entry  Entry to generate reader for
 * @param includeFlags  Whether to include `flags` field in the result object
 * @returns  Code as a writers map entry
 */
export function generateReaderCodeForTlEntry(
    entry: TlEntry,
    includeFlags = false
): string {
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

        if (arg.predicate) {
            const s = arg.predicate.split('.')
            const fieldName = s[0]
            const bitIndex = parseInt(s[1])

            if (!(fieldName in flagsFields)) {
                throw new Error(
                    `Invalid predicate: ${arg.predicate} - unknown field (in ${entry.name})`
                )
            }
            if (isNaN(bitIndex) || bitIndex < 0 || bitIndex > 32) {
                throw new Error(
                    `Invalid predicate: ${arg.predicate} - invalid bit`
                )
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
        } else {
            if (isBeforeLastFlag) {
                beforeReturn += `var ${argName}=`
                returnCode += `${argName}:${argName},`
            } else {
                returnCode += `${argName}:`
            }
        }

        let vector = false
        let type = arg.type
        const m = type.match(/^[Vv]ector[< ](.+?)[> ]$/)
        if (m) {
            vector = true
            type = m[1]
        }

        if (type in TL_PRIMITIVES) {
            if (type === 'Bool') type = 'boolean'
        } else {
            type = 'object'
        }

        let code
        if (vector) {
            code = `r.vector(r.${type})`
        } else {
            code = `r.${type}()`
        }

        if (arg.predicate) {
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
 * @param varName  Name of the variable containing the result
 * @param methods  Whether to include method readers
 */
export function generateReaderCodeForTlEntries(
    entries: TlEntry[],
    varName: string,
    methods = true
): string {
    let ret = `var ${varName}={\n`

    entries.forEach((entry) => {
        if (entry.kind === 'method' && !methods) return

        ret += generateReaderCodeForTlEntry(entry) + '\n'
    })

    return ret + '}'
}
