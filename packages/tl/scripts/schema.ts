import { TlEntry, TlFullSchema } from '@mtcute/tl-utils/src/types'
import { parseFullTlSchema } from '@mtcute/tl-utils/src/schema'

interface TlPackedUnion {
    // name
    n: string
    // comment
    d?: string
    // methods
    m: string[]
    // classes
    c: string[]
}

export interface TlPackedSchema {
    // layer
    l: number
    // entries
    e: TlEntry[]
    // unions (only comments)
    u: Record<string, string>
}

export function packTlSchema(
    schema: TlFullSchema,
    layer: number
): TlPackedSchema {
    const ret: TlPackedSchema = {
        l: layer,
        e: schema.entries,
        u: {},
    }

    for (const name in schema.unions) {
        if (!schema.unions.hasOwnProperty(name)) continue
        const union = schema.unions[name]

        if (union.comment) {
            ret.u[name] = union.comment
        }
    }

    return ret
}

export function unpackTlSchema(schema: TlPackedSchema): [TlFullSchema, number] {
    const res = parseFullTlSchema(schema.e)

    for (const name in schema.u) {
        if (!schema.u.hasOwnProperty(name)) continue
        if (!res.unions[name]) continue

        res.unions[name].comment = schema.u[name]
    }

    return [res, schema.l]
}
