import { TlEntry } from './types'

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
        if (forIdComputation && arg.predicate && arg.type === 'true') continue

        str += arg.name + ':'

        if (arg.predicate) {
            str += arg.predicate + '?'
        }

        if (forIdComputation) {
            str += normalizeType(arg.type) + ' '
        } else {
            str += arg.type + ' '
        }
    }

    if (forIdComputation) {
        str += '= ' + normalizeType(entry.type)
    } else {
        str += '= ' + entry.type + ';'
    }

    return str
}
