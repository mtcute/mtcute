import { TL_PRIMITIVES, TlEntry } from '../types'
import { computeConstructorIdFromEntry } from '../ctor-id'
import { snakeToCamel } from './utils'

/**
 * Returns code as an object entry
 */
export function generateReaderCodeForTlEntry(entry: TlEntry): string {
    if (entry.id === 0) entry.id = computeConstructorIdFromEntry(entry)

    let ret = `${entry.id}:function(r){`

    if (!entry.arguments.length) {
        return ret + `return{_:'${entry.name}'}},`
    }

    ret += `return{_:'${entry.name}',`

    const flagsFields: Record<string, 1> = {}

    entry.arguments.forEach((arg) => {
        if (arg.type === '#') {
            const code = `var ${arg.name}=r.uint();`
                ret = ret.replace('return{', code + 'return{')
            flagsFields[arg.name] = 1
            return
        }

        const argName = snakeToCamel(arg.name)

        if (arg.predicate) {
            const s = arg.predicate.split('.')
            const fieldName = s[0]
            const bitIndex = parseInt(s[1])

            if (!(fieldName in flagsFields)) {
                throw new Error(`Invalid predicate: ${arg.predicate} - unknown field`)
            }
            if (isNaN(bitIndex) || bitIndex < 0 || bitIndex > 32) {
                throw new Error(`Invalid predicate: ${arg.predicate} - invalid bit`)
            }

            const condition = `${fieldName}&${1 << bitIndex}`

            if (arg.type === 'true') {
                ret += `${argName}:!!(${condition}),`
                return
            }

            ret += `${argName}:${condition}?`
        } else {
            ret += `${argName}:`
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

        if (vector) {
            ret += `r.vector(r.${type})`
        } else {
            ret += `r.${type}()`
        }

        if (arg.predicate) {
            ret += ':void 0'
        }

        ret += ','
    })

    return ret + '}},'
}

export function generateReaderCodeForTlEntries(entries: TlEntry[], varName: string, methods = true): string {
    let ret = `var ${varName}={\n`

    entries.forEach((entry) => {
        if (entry.kind === 'method' && !methods) return

        ret += generateReaderCodeForTlEntry(entry) + '\n'
    })

    return ret + '}'
}
