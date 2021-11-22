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

    ret += `var o={_:'${entry.name}',`

    let inObject = true
    function finalizeObject(pos: number) {
        if (!inObject) return

        for (let i = pos; i < entry.arguments.length; i++) {
            const arg = entry.arguments[i]

            if (arg.type !== '#') {
                ret += arg.name + ':void 0,'
            }
        }
        ret += '};'

        inObject = false
    }

    const flagsFields: Record<string, 1> = {}

    entry.arguments.forEach((arg, idx) => {
        if (arg.type === '#') {
            const code = `var ${arg.name}=r.uint();`
            if (idx === 0) {
                ret = ret.replace('var o=', code + 'var o=')
            } else {
                finalizeObject(idx)
                ret += code
            }
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
                if (inObject) {
                    ret += `${argName}:!!(${condition}),`
                } else {
                    ret += `o.${argName}=!!(${condition});`
                }
                return
            }

            if (inObject) {
                ret += `${argName}:${condition}?`
            } else {
                ret += `if(${condition})o.${argName}=`
            }
        } else {
            if (inObject) {
                ret += `${argName}:`
            } else {
                ret += `o.${argName}=`
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

        if (vector) {
            ret += `r.vector(r.${type})`
        } else {
            ret += `r.${type}()`
        }

        if (arg.predicate && inObject) {
            ret += ':void 0'
        }

        ret += inObject ? ',' : ';'
    })

    if (inObject) {
        // simple object, direct return
        return ret.replace('var o=', 'return') + '}},'
    }

    return ret + 'return o},'
}

export function generateReaderCodeForTlEntries(entries: TlEntry[], varName: string, methods = true): string {
    let ret = `var ${varName}={\n`

    entries.forEach((entry) => {
        if (entry.kind === 'method' && !methods) return

        ret += generateReaderCodeForTlEntry(entry) + '\n'
    })

    return ret + '}'
}
