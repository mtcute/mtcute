const callbacks = new Set<() => void>()

let registered = false

export function beforeExit(fn: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }
  if (!registered) {
    registered = true

    window.addEventListener('beforeunload', () => {
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
