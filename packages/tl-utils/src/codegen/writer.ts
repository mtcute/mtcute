import { TL_PRIMITIVES, TlEntry } from '../types'
import { computeConstructorIdFromEntry } from '../ctor-id'
import { snakeToCamel } from './utils'

export const TL_WRITER_PRELUDE =
    'function h(o, p){' +
    'var q=o[p];' +
    'if(q===void 0)' +
    "throw Error('Object '+o._+' is missing required property '+p);" +
    'return q}\n'

/**
 * Returns code as an object entry.
 *
 * `h` (has) function should be available
 */
export function generateWriterCodeForTlEntry(entry: TlEntry): string {
    if (entry.id === 0) entry.id = computeConstructorIdFromEntry(entry)

    let ret = `'${entry.name}':function(w${
        entry.arguments.length ? ',v' : ''
    }){`

    ret += `w.uint(${entry.id});`

    const flagsFields: Record<string, 1> = {}

    entry.arguments.forEach((arg) => {
        if (arg.type === '#') {
            ret += `var ${arg.name}=0;`

            entry.arguments.forEach((arg1) => {
                let s
                if (
                    !arg1.predicate ||
                    (s = arg1.predicate.split('.'))[0] !== arg.name
                )
                    return

                const arg1Name = snakeToCamel(arg1.name)

                const bitIndex = parseInt(s[1])
                if (isNaN(bitIndex) || bitIndex < 0 || bitIndex > 32) {
                    throw new Error(
                        `Invalid predicate: ${arg1.predicate} - invalid bit`
                    )
                }

                const action = `${arg.name}|=${1 << bitIndex};`

                if (arg1.type === 'true') {
                    ret += `if(v.${arg1Name}===true)${action}`
                } else if (arg1.type.match(/^[Vv]ector/)) {
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

        let vector = false
        let type = arg.type
        const m = type.match(/^[Vv]ector[< ](.+?)[> ]$/)
        if (m) {
            vector = true
            type = m[1]
        }

        if (arg.predicate) {
            if (type === 'true') return // included in flags

            ret += `if(_${argName})`
        } else {
            ret += `h(v,'${argName}');`
        }

        if (type in TL_PRIMITIVES) {
            if (type === 'Bool') type = 'boolean'
        } else {
            type = 'object'
        }

        if (vector) {
            ret += `w.vector(w.${type}, v.${argName});`
        } else {
            ret += `w.${type}(v.${argName});`
        }
    })

    return ret + '},'
}

export function generateWriterCodeForTlEntries(
    entries: TlEntry[],
    varName: string,
    prelude = true
): string {
    let ret = ''
    if (prelude) ret += TL_WRITER_PRELUDE
    ret += `var ${varName}={\n`

    entries.forEach((entry) => {
        ret += generateWriterCodeForTlEntry(entry) + '\n'
    })

    return ret + '}'
}
