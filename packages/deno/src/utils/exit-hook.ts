const callbacks = new Set<() => void>()

let registered = false

export function beforeExit(fn: () => void): () => void {
    if (!registered) {
        registered = true

        window.addEventListener('unload', () => {
            for (const callback of callbacks) {
                callback()
            }
        })
    }

    callbacks.add(fn)

    return () => {
        callbacks.delete(fn)
    }
}
