export type ControllablePromise<T = any, E = any> = Promise<T> & {
    resolve(val: T): void
    reject(err?: E): void
}

export function createControllablePromise<
    T = any,
    E = any
>(): ControllablePromise<T, E> {
    let _resolve: any
    let _reject: any
    const promise = new Promise<T>((resolve, reject) => {
        _resolve = resolve
        _reject = reject
    })
    ;(promise as ControllablePromise<T>).resolve = _resolve
    ;(promise as ControllablePromise<T>).reject = _reject
    return promise as ControllablePromise<T>
}
