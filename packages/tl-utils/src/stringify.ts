import { TlEntry } from './types'
import { stringifyArgumentType } from './utils'

function normalizeType(s: string): string {
    return s
        .replace(/^bytes/, 'string')
        .replace(/</g, ' ')
        .replace(/>/g, '')
        .replace('int53', 'long')
}

/**
 * Generate TL definition for a given entry.
 *
 * @param entry  Entry to generate definition for
 * @param forIdComputation
 *   Whether to generate definition for constructor ID computation
 *   (it has slightly different syntax, will not contain `true` flags, etc.)
 */
export function writeTlEntryToString(
    entry: TlEntry,
    forIdComputation = false,
): string {
    let str = entry.name

    if (!forIdComputation && entry.id) {
        str += '#' + entry.id.toString(16)
    }

    str += ' '

    if (entry.generics) {
        for (const g of entry.generics) {
            if (forIdComputation) {
                str += g.name + ':' + g.type + ' '
            } else {
                str += '{' + g.name + ':' + g.type + '} '
            }
        }
    }

    for (const arg of entry.arguments) {
        if (
            forIdComputation &&
            arg.typeModifiers?.predicate &&
            arg.type === 'true'
        ) {
            continue
        }

        str += arg.name + ':'

        const type = stringifyArgumentType(arg.type, arg.typeModifiers)

        if (forIdComputation) {
            str += normalizeType(type) + ' '
        } else {
            str += type + ' '
        }
    }

    if (forIdComputation) {
        str += '= ' + normalizeType(entry.type)
    } else {
        str += '= ' + entry.type + ';'
    }

    return str
}
