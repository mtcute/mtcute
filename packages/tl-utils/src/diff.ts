import { computeConstructorIdFromEntry } from './ctor-id'
import {
    TlArgument,
    TlArgumentDiff,
    TlEntry,
    TlEntryDiff,
    TlFullSchema,
    TlSchemaDiff,
} from './types'

/**
 * Compute difference between two TL entries.
 *
 * @param a  Entry A (field `old` in diff)
 * @param b  Entry B (field `new` in diff)
 */
export function generateTlEntriesDifference(
    a: TlEntry,
    b: TlEntry,
): TlEntryDiff {
    if (a.kind !== b.kind || a.name !== b.name) {
        throw new Error('Incompatible entries')
    }

    const diff: TlEntryDiff = {
        name: a.name,
    }

    if (a.comment !== b.comment) {
        diff.comment = {
            old: a.comment,
            new: b.comment,
        }
    }

    if (a.id !== b.id) {
        let oldId = a.id
        let newId = b.id

        if (oldId === 0) oldId = computeConstructorIdFromEntry(a)
        if (newId === 0) newId = computeConstructorIdFromEntry(b)

        if (oldId !== newId) {
            diff.id = {
                old: oldId,
                new: newId,
            }
        }
    }

    if (
        !a.generics !== !b.generics ||
        (a.generics &&
            b.generics &&
            JSON.stringify(a.generics) !== JSON.stringify(b.generics))
    ) {
        diff.generics = {
            old: a.generics,
            new: b.generics,
        }
    }

    const argsDiff: NonNullable<TlEntryDiff['arguments']> = {
        added: [],
        removed: [],
        modified: [],
    }

    const oldArgsIndex: Record<string, TlArgument> = {}

    a.arguments.forEach((arg) => {
        oldArgsIndex[arg.name] = arg
    })

    const newArgsIndex: Record<string, 1> = {}

    b.arguments.forEach((arg) => {
        newArgsIndex[arg.name] = 1

        if (!(arg.name in oldArgsIndex)) {
            argsDiff.added.push(arg)

            return
        }

        const oldArg = oldArgsIndex[arg.name]

        const diff: TlArgumentDiff = {
            name: arg.name,
        }

        if (arg.type !== oldArg.type) {
            diff.type = {
                old: oldArg.type,
                new: arg.type,
            }
        }

        if (arg.predicate !== oldArg.predicate) {
            diff.predicate = {
                old: oldArg.predicate,
                new: arg.predicate,
            }
        }

        if (arg.comment !== oldArg.comment) {
            diff.comment = {
                old: oldArg.comment,
                new: arg.comment,
            }
        }

        if (diff.type || diff.predicate || diff.comment) {
            argsDiff.modified.push(diff)
        }
    })

    a.arguments.forEach((arg) => {
        if (!(arg.name in newArgsIndex)) {
            argsDiff.removed.push(arg)
        }
    })

    if (
        argsDiff.added.length ||
        argsDiff.removed.length ||
        argsDiff.modified.length
    ) {
        diff.arguments = argsDiff
    }

    return diff
}

/**
 * Compute difference between two TL schemas.
 *
 * @param a  Entry A (field `old` in diff)
 * @param b  Entry B (field `new` in diff)
 */
export function generateTlSchemasDifference(
    a: TlFullSchema,
    b: TlFullSchema,
): TlSchemaDiff {
    // schemas already contain indexes, so we don't need to make our own

    const diff: TlSchemaDiff = {
        classes: {
            added: [],
            removed: [],
            modified: [],
        },
        methods: {
            added: [],
            removed: [],
            modified: [],
        },
        unions: {
            added: [],
            removed: [],
            modified: [],
        },
    }

    const unionDiffIndex: Record<
        string,
        TlSchemaDiff['unions']['modified'][number]
    > = {}
    const unionDiffIndex2: Record<string, 1> = {}

    a.entries.forEach((entry) => {
        const kind = entry.kind === 'class' ? 'classes' : 'methods'

        // check union
        const union = a.unions[entry.type]

        if (!(entry.type in b.unions) && !(entry.type in unionDiffIndex2)) {
            // deleted union
            unionDiffIndex2[entry.type] = 1
            diff.unions.removed.push(union)
        }

        if (!(entry.name in b[kind])) {
            diff[kind].removed.push(entry)

            // we also need to diff the respective union
            if (entry.type in b.unions) {
                if (!(entry.type in unionDiffIndex)) {
                    unionDiffIndex[entry.type] = {
                        name: entry.type,
                        classes: {
                            added: [],
                            removed: [],
                            modified: [],
                        },
                        methods: {
                            added: [],
                            removed: [],
                            modified: [],
                        },
                    }
                    diff.unions.modified.push(unionDiffIndex[entry.type])
                }
                const unionDiff = unionDiffIndex[entry.type]
                unionDiff[kind].removed.push(entry)
            }

            return
        }

        const other = b[kind][entry.name]

        const entryDiff = generateTlEntriesDifference(entry, other)

        if (entryDiff.id || entryDiff.generics || entryDiff.arguments) {
            diff[kind].modified.push(entryDiff)
        }
    })

    b.entries.forEach((entry) => {
        const kind = entry.kind === 'class' ? 'classes' : 'methods'

        // check union
        const union = b.unions[entry.type]

        if (!(entry.type in a.unions) && !(entry.type in unionDiffIndex2)) {
            // added union
            unionDiffIndex2[entry.type] = 1
            diff.unions.added.push(union)
        }

        if (!(entry.name in a[kind])) {
            diff[kind].added.push(entry)

            // we also need to diff the respective union
            if (entry.type in a.unions) {
                if (!(entry.type in unionDiffIndex)) {
                    unionDiffIndex[entry.type] = {
                        name: entry.type,
                        classes: {
                            added: [],
                            removed: [],
                            modified: [],
                        },
                        methods: {
                            added: [],
                            removed: [],
                            modified: [],
                        },
                    }
                    diff.unions.modified.push(unionDiffIndex[entry.type])
                }
                const unionDiff = unionDiffIndex[entry.type]
                unionDiff[kind].added.push(entry)
            }

            return
        }
    })

    return diff
}
