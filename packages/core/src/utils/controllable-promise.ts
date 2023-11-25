/**
 * A promise that can be resolved or rejected from outside.
 */
export type ControllablePromise<T = unknown> = Promise<T> & {
    resolve(val: T): void
    reject(err?: unknown): void
}

/**
 * Creates a promise that can be resolved or rejected from outside.
 */
export function createControllablePromise<T = unknown>(): ControllablePromise<T> {
    let _resolve: ControllablePromise<T>['resolve']
    let _reject: ControllablePromise<T>['reject']
    const promise = new Promise<T>((resolve, reject) => {
        _resolve = resolve
        _reject = reject
    })
    // ts doesn't like this, but it's fine

    ;(promise as ControllablePromise<T>).resolve = _resolve!
    ;(promise as ControllablePromise<T>).reject = _reject!

    return promise as ControllablePromise<T>
}
