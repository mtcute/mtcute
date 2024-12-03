import type { TlArgument, TlEntry, TlFullSchema } from './types.js'
import { computeConstructorIdFromEntry } from './ctor-id.js'

/**
 * Merge multiple TL entries into a single entry.
 *
 * Note: this will only succeed if all entries have the same ID.
 *
 * @param entries  Entries to merge
 */
export function mergeTlEntries(entries: TlEntry[]): TlEntry | string {
    const first = entries[0]

    const result: TlEntry = {
        kind: first.kind,
        name: first.name,
        type: first.type,
        typeModifiers: first.typeModifiers,
        id: first.id,
        comment: first.comment,
        generics: first.generics?.map(it => ({ ...it })),
        arguments: first.arguments.map(it => ({ ...it })),
    }

    if (result.id === 0) {
        result.id = computeConstructorIdFromEntry(result)
    }

    const argsIndex: Record<string, TlArgument> = {}
    const flagsLastIndex: Record<string, number> = {}

    result.arguments.forEach((arg, idx) => {
        argsIndex[arg.name] = arg

        if (arg.type === '#') {
            flagsLastIndex[arg.name] = idx
        }

        if (arg.typeModifiers?.predicate) {
            const flagsField = arg.typeModifiers.predicate.split('.')[0]
            flagsLastIndex[flagsField] = idx
        }
    })

    for (let i = 1; i < entries.length; i++) {
        const entry = entries[i]

        // the only thing we should actually merge are optional true flags
        // anything other than that is *not compatible* and we must return null
        // (and also comments fwiw)

        // even if the entry contains id, let's re-calculate it just to be sure
        const ctorId = computeConstructorIdFromEntry(entry)

        // check if basic fields match
        if (result.kind !== entry.kind) return 'basic info mismatch - kind'
        if (result.name !== entry.name) return 'basic info mismatch - name'
        if (result.type !== entry.type) return 'basic info mismatch - type'
        if (result.id !== ctorId) return 'basic info mismatch - id'

        // since we re-calculated id manually, we can skip checking
        // generics and arguments, and get straight to merging

        if (!result.comment && entry.comment) {
            result.comment = entry.comment
        }

        for (let j = 0; j < entry.arguments.length; j++) {
            const entryArgument = entry.arguments[j]
            const resultArgument = argsIndex[entryArgument.name]

            if (!resultArgument) {
                // yay a new arg
                // we can only add optional true args, since any others will change id
                // ids match, so this must be the case
                if (!entryArgument.typeModifiers?.predicate) {
                    throw new Error('new argument is not optional')
                }

                // we also need to make sure we put it *after* the respective flags field

                const flagsField = entryArgument.typeModifiers.predicate.split('.')[0]
                const targetIdx = flagsLastIndex[flagsField]

                // targetIdx *must* exist, otherwise ids wouldn't match

                result.arguments.splice(targetIdx + 1, 0, entryArgument)
                argsIndex[entryArgument.name] = entryArgument

                // update last indexes
                // we also need to update subsequent flags if there are any
                Object.keys(flagsLastIndex).forEach((flag) => {
                    if (flagsLastIndex[flag] >= targetIdx) {
                        flagsLastIndex[flag]++
                    }
                })

                continue
            }

            // args exists both in result and current entry
            // since ctor ids match, it must be the same, so we don't need to check
            // we still need to merge comments though

            if (!resultArgument.comment && entryArgument.comment) {
                resultArgument.comment = entryArgument.comment
            }
        }
    }

    return result
}

/**
 * Merge multiple TL schemas into a single schema.
 *
 * @param schemas  Schemas to merge
 * @param onConflict  Callback to handle conflicts
 */
export async function mergeTlSchemas(
    schemas: TlFullSchema[],
    onConflict: (
        options: (TlEntry | undefined)[],
        reason: string,
    ) => TlEntry | undefined | Promise<TlEntry | undefined>,
): Promise<TlFullSchema> {
    const result: TlFullSchema = {
        entries: [],
        classes: {},
        methods: {},
        unions: {},
    }

    const resolvedConflictsClasses: Record<string, 1> = {}
    const resolvedConflictsMethods: Record<string, 1> = {}

    for (let i = 0; i < schemas.length; i++) {
        const schema = schemas[i]

        for (let i1 = 0; i1 < schema.entries.length; i1++) {
            const entry = schema.entries[i1]

            const kind = entry.kind === 'class' ? 'classes' : 'methods'
            const index = result[kind]
            const conflictIndex = entry.kind === 'class' ? resolvedConflictsClasses : resolvedConflictsMethods

            if (entry.name in conflictIndex) {
                // this entry was manually processed by user after a conflict
                // and should be skipped
                continue
            }

            if (!(entry.name in index)) {
                // new one, add as-is
                index[entry.name] = entry
                continue
            }

            const existing = index[entry.name]
            const merged = mergeTlEntries([existing, entry])

            if (typeof merged === 'string') {
                // merge conflict
                // find all candidates from all schemas and let the user decide
                const candidates = schemas.map(schema => schema[kind][entry.name])

                const chosen = await onConflict(candidates, merged)

                if (chosen) {
                    index[entry.name] = chosen
                } else {
                    delete index[entry.name]
                }

                conflictIndex[entry.name] = 1

                continue
            }

            index[entry.name] = merged
        }

        for (const name in schema.unions) {
            const union = schema.unions[name]

            if (!(name in result.unions)) {
                result.unions[name] = {
                    name,
                    classes: [],
                }
            }
            const existing = result.unions[name]

            if (union.comment && !existing.comment) {
                existing.comment = union.comment
            }
        }
    }

    // for simplicity sake, entries and unions are generated after merging is done
    for (let i = 0; i < 2; i++) {
        const kind = i === 0 ? 'classes' : 'methods'
        const index = result[kind]

        for (const name in index) {
            const entry = index[name]

            result.entries.push(entry)

            if (kind === 'classes') {
                result.unions[entry.type].classes.push(entry)
            }
        }
    }

    return result
}
