import { parseFullTlSchema, TlEntry, TlFullSchema } from '@mtcute/tl-utils'

// interface TlPackedUnion {
//     // name
//     n: string
//     // comment
//     d?: string
//     // methods
//     m: string[]
//     // classes
//     c: string[]
// }

export interface TlPackedSchema {
    // layer
    l: number
    // entries
    e: TlEntry[]
    // unions (only comments)
    u: Record<string, string>
}

export function packTlSchema(schema: TlFullSchema, layer: number): TlPackedSchema {
    const ret: TlPackedSchema = {
        l: layer,
        e: schema.entries,
        u: {},
    }

    for (const name in schema.unions) {
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
        if (!res.unions[name]) continue

        res.unions[name].comment = schema.u[name]
    }

    return [res, schema.l]
}
