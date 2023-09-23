/**
 * A promise that can be resolved or rejected from outside.
 */
export type ControllablePromise<T = unknown> = Promise<T> & {
    resolve(val: T): void
    reject(err?: unknown): void
}

/**
 * A promise that can be cancelled.
 */
export type CancellablePromise<T = unknown> = Promise<T> & {
    cancel(): void
}

/**
 * The promise was cancelled
 */
export class PromiseCancelledError extends Error {}

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

/**
 * Creates a promise that can be cancelled.
 *
 * @param onCancel  Callback to call when cancellation is requested
 */
export function createCancellablePromise<T = unknown>(
    onCancel: () => void,
): ControllablePromise<T> & CancellablePromise<T> {
    // todo rethink this in MTQ-20

    const promise = createControllablePromise()

    ;(promise as unknown as CancellablePromise<T>).cancel = () => {
        promise.reject(new PromiseCancelledError())
        onCancel()
    }

    return promise as ControllablePromise<T> & CancellablePromise<T>
}
