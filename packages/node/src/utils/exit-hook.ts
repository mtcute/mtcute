// roughly based on https://github.com/sindresorhus/exit-hook/blob/main/index.js, MIT license

let installed = false
let handled = false

const callbacks = new Set<() => void>()

const myHandlers = new Map<string, () => void>()

function register(shouldManuallyExit: boolean, signal: number, event: string) {
  function eventHandler() {
    if (handled) {
      return
    }

    handled = true

    for (const callback of callbacks) {
      callback()
    }

    for (const [event, handler] of myHandlers) {
      process.off(event, handler)
    }

    if (shouldManuallyExit) {
      // send the signal again and let node handle it
      process.kill(process.pid, signal)
    }
  }

  process.on(event, eventHandler)
  myHandlers.set(event, eventHandler)
}

export function beforeExit(fn: () => void): () => void {
  // unsupported platform
  if (typeof process === 'undefined') return () => {}

  if (!installed) {
    installed = true

    register(true, 0, 'beforeExit')
    register(true, 2, 'SIGINT')
    register(true, 15, 'SIGTERM')
    register(false, 15, 'exit')
  }

  callbacks.add(fn)

  return () => {
    callbacks.delete(fn)
  }
}
