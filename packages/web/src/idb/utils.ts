// <deno-insert>
// declare type IDBTransaction = any
// declare type IDBRequest<T> = { result: T, onsuccess?: (ev: any) => void, onerror?: (ev: any) => void, error?: any }
// </deno-insert>

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
