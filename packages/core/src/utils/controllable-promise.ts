export type ControllablePromise<T = any> = Promise<T> & {
    resolve(val: T): void
    reject(err?: unknown): void
}

export type CancellablePromise<T = any> = Promise<T> & {
    cancel(): void
}

export class PromiseCancelledError extends Error {}

export function createControllablePromise<T = any>(): ControllablePromise<T> {
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

export function createCancellablePromise<T = any>(
    onCancel: () => void
): ControllablePromise<T> & CancellablePromise<T> {
    const promise = createControllablePromise()
    ;((promise as unknown) as CancellablePromise<T>).cancel = () => {
        promise.reject(new PromiseCancelledError())
        onCancel()
    }
    return promise as ControllablePromise<T> & CancellablePromise<T>
}
