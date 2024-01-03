export function txToPromise(tx: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
    })
}

export function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
    })
}

export async function* cursorToIterator<T extends IDBCursor>(
    req: IDBRequest<T | null>,
): AsyncIterableIterator<T> {
    let cursor = await reqToPromise(req)

    while (cursor) {
        yield cursor
        cursor.continue()
        cursor = await reqToPromise(req)
    }
}
