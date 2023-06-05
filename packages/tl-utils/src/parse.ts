import { computeConstructorIdFromString } from './ctor-id'
import { TL_PRIMITIVES, TlEntry } from './types'
import { parseTdlibStyleComment } from './utils'

const SINGLE_REGEX =
    /^(.+?)(?:#([0-9a-f]{1,8}))?(?: \?)?(?: {(.+?:.+?)})? ((?:.+? )*)= (.+);$/

function applyPrefix(prefix: string, type: string): string {
    if (type in TL_PRIMITIVES) return type

    const m = type.match(/^[Vv]ector[< ](.+?)[> ]$/)
    if (m) return `Vector<${applyPrefix(prefix, m[1])}>`

    return prefix + type
}

/**
 * Parse TL schema into a list of entries.
 *
 * @param tl  TL schema
 * @param params  Additional parameters
 */
export function parseTlToEntries(
    tl: string,
    params?: {
        /**
         * Whether to throw an error if a line failed to parse
         */
        panicOnError?: boolean

        /**
         * Function to be called if there was an error while parsing a line
         *
         * @param err  Error
         * @param line  Line that failed to parse
         * @param num  Line number
         */
        onError?: (err: Error, line: string, num: number) => void

        /**
         * Function to be called a comment is found not belonging to any entry
         *
         * @param comment  Comment text
         */
        onOrphanComment?: (comment: string) => void

        /**
         * Prefix to be applied to all types
         */
        prefix?: string

        /**
         * Whether to apply the prefix to arguments as well
         */
        applyPrefixToArguments?: boolean
    },
): TlEntry[] {
    const ret: TlEntry[] = []

    const lines = tl.split('\n')

    let currentKind: TlEntry['kind'] = 'class'
    let currentComment = ''
    const prefix = params?.prefix ?? ''

    lines.forEach((line, idx) => {
        line = line.trim()

        if (line === '') {
            if (params?.onOrphanComment) {
                params.onOrphanComment(currentComment)
            }

            currentComment = ''

            return
        }

        if (line.match(/^\/\//)) {
            if (currentComment) {
                if (line[2] === '-') {
                    currentComment += '\n' + line.substring(3).trim()
                } else {
                    currentComment += ' ' + line.substring(2).trim()
                }
            } else {
                currentComment = line.substring(2).trim()
            }

            return
        }

        if (line === '---functions---') {
            currentKind = 'method'

            return
        }

        if (line === '---types---') {
            currentKind = 'class'

            return
        }

        const match = SINGLE_REGEX.exec(line)

        if (!match) {
            const err = new Error(`Failed to parse line ${idx + 1}: ${line}`)

            if (params?.panicOnError) {
                throw err
            } else if (params?.onError) {
                params.onError(err, line, idx + 1)
            } else {
                console.warn(err)
            }

            return
        }

        const [, typeName, typeId, generics, args, type] = match

        if (typeName in TL_PRIMITIVES) {
            return
        }

        const typeIdNum = typeId ?
            parseInt(typeId, 16) :
            computeConstructorIdFromString(line)

        const argsParsed =
            args && !args.match(/\[ [a-z]+ ]/i) ?
                args
                    .trim()
                    .split(' ')
                    .map((j) => j.split(':')) :
                []

        const entry: TlEntry = {
            kind: currentKind,
            name: prefix + typeName,
            id: typeIdNum,
            type,
            arguments: [],
        }

        if (generics) {
            entry.generics = generics.split(',').map((it) => {
                const [name, type] = it.split(':')

                return { name, type }
            })
        }

        if (argsParsed.length) {
            argsParsed.forEach(([name, typ]) => {
                let [predicate, type] = typ.split('?')

                if (!type) {
                    // no predicate, `predicate` is the type

                    if (params?.applyPrefixToArguments) {
                        predicate = applyPrefix(prefix, predicate)
                    }
                    entry.arguments.push({
                        name,
                        type: predicate,
                    })
                } else {
                    // there is a predicate

                    if (params?.applyPrefixToArguments) {
                        type = applyPrefix(prefix, type)
                    }
                    entry.arguments.push({
                        name,
                        type,
                        predicate,
                    })
                }
            })
        }

        if (currentComment) {
            if (currentComment.match(/^@description /)) {
                // tdlib-style comment
                const obj = parseTdlibStyleComment(currentComment)

                if (obj.description) entry.comment = obj.description

                entry.arguments.forEach((arg) => {
                    if (arg.name in obj) {
                        arg.comment = obj[arg.name]
                    }
                })
            } else {
                entry.comment = currentComment
            }

            currentComment = ''
        }

        ret.push(entry)
    })

    if (currentComment && params?.onOrphanComment) {
        params.onOrphanComment(currentComment)
    }

    return ret
}
