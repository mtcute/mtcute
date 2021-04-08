export function* chunks<T>(iter: Iterable<T>, size = 100): Iterable<T[]> {
    let buf: T[] = []

    for (const item of iter) {
        buf.push(item)
        if (buf.length === size) {
            yield buf
            buf = []
        }
    }

    if (buf.length) yield buf
}

export function zip<T1, T2>(
    iter1: Iterable<T1>,
    iter2: Iterable<T2>
): Iterable<[T1, T2]>
export function zip<T1, T2, T3>(
    iter1: Iterable<T1>,
    iter2: Iterable<T2>,
    iter3: Iterable<T3>
): Iterable<[T1, T2, T3]>
export function zip(...iters: Iterable<any>[]): Iterable<any[]>
export function* zip(...iters: Iterable<any>[]): Iterable<any[]> {
    const iterables = iters.map((iter) => iter[Symbol.iterator]())

    for (;;) {
        const row = []
        for (const iter of iterables) {
            const res = iter.next()
            if (res.done) return
            row.push(res.value)
        }

        yield row
    }
}

export async function groupByAsync<T, K extends string | number>(
    items: Iterable<T>,
    keyer: (item: T) => Promise<K>
): Promise<Record<K, T[]>> {
    const ret: Record<K, T[]> = {} as any

    for (const item of items) {
        const key = await keyer(item)
        if (!ret[key]) ret[key] = []

        ret[key].push(item)
    }

    return ret
}
