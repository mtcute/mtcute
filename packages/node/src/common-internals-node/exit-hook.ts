// roughly based on https://github.com/sindresorhus/exit-hook/blob/main/index.js, MIT license

let installed = false
let handled = false

const callbacks = new Set<() => void>()

function exit(shouldManuallyExit: boolean, signal: number, event: string) {
    return function eventHandler() {
        if (handled) {
            return
        }

        handled = true

        const exitCode = 128 + signal

        for (const callback of callbacks) {
            callback()
        }

        if (shouldManuallyExit) {
            // if the user has some custom handlers after us, we don't want to exit the process

            const listeners = process.rawListeners(event)
            const idx = listeners.indexOf(eventHandler)

            if (idx === listeners.length - 1) {
                process.exit(exitCode)
            }
        }
    }
}

export function beforeExit(fn: () => void): () => void {
    // unsupported platform
    if (typeof process === 'undefined') return () => {}

    if (!installed) {
        installed = true

        process.on('beforeExit', exit(true, -128, 'beforeExit'))
        process.on('SIGINT', exit(true, 2, 'SIGINT'))
        process.on('SIGTERM', exit(true, 15, 'SIGINT'))
        process.on('exit', exit(false, 15, 'exit'))
    }

    callbacks.add(fn)

    return () => {
        callbacks.delete(fn)
    }
}
