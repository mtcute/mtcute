import { TlEntry, TlFullSchema } from './types'
import { computeConstructorIdFromEntry } from './ctor-id'
import { writeTlEntryToString } from './stringify'

const replaceNewlineInComment = (s: string): string =>
    s.replace(/\n/g, '\n//- ')

export function parseFullTlSchema(entries: TlEntry[]): TlFullSchema {
    const ret: TlFullSchema = {
        entries,
        classes: {},
        methods: {},
        unions: {},
    }

    entries.forEach((entry) => {
        const kind = entry.kind === 'class' ? 'classes' : 'methods'

        ret[kind][entry.name] = entry

        if (kind === 'classes') {
            const type = entry.type

            if (!(type in ret.unions)) {
                ret.unions[type] = {
                    name: type,
                    classes: [],
                }
            }
            ret.unions[type].classes.push(entry)
        }
    })

    return ret
}

export function writeTlEntriesToString(
    entries: TlEntry[],
    params?: {
        computeIds?: boolean
        tdlibComments?: boolean
        omitPrimitives?: boolean
    }
): string {
    const lines: string[] = []

    if (!params?.omitPrimitives) {
        lines.push(`int ? = Int;
long ? = Long;
double ? = Double;
string ? = String;
int128 4*[ int ] = Int128;
int256 8*[ int ] = Int256;
bytes = Bytes;

vector#1cb5c415 {t:Type} # [ t ] = Vector t;
true#3fedd339 = True;
boolFalse#bc799737 = Bool;
boolTrue#997275b5 = Bool;
`)
    }

    let currentKind: TlEntry['kind'] = 'class'

    entries.forEach((entry) => {
        if (entry.kind !== currentKind) {
            if (entry.kind === 'class') {
                lines.push('---types---')
            } else {
                lines.push('---functions---')
            }

            currentKind = entry.kind
        }

        if (entry.comment) {
            if (params?.tdlibComments) {
                lines.push(
                    `// @description ${replaceNewlineInComment(entry.comment)}`
                )
            } else {
                lines.push(`// ${replaceNewlineInComment(entry.comment)}`)
            }
        }

        if (params?.tdlibComments) {
            entry.arguments.forEach((arg) => {
                if (arg.comment) {
                    lines.push(
                        `// @${arg.name} ${replaceNewlineInComment(
                            arg.comment
                        )}`
                    )
                }
            })
        }

        if (!entry.id && params?.computeIds !== false) {
            entry.id = computeConstructorIdFromEntry(entry)
        }

        lines.push(writeTlEntryToString(entry))
    })

    return lines.join('\n')
}
