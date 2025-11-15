export function combineAbortSignals(signal1: AbortSignal, signal2?: AbortSignal): AbortSignal {
  if (!signal2) return signal1

  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([signal1, signal2])
  }

  const controller = new AbortController()

  function abort(this: AbortSignal) {
    controller.abort(this.reason)
    signal1.removeEventListener('abort', abort)
    signal2!.removeEventListener('abort', abort)
  }

  signal1.addEventListener('abort', abort)
  signal2.addEventListener('abort', abort)

  return controller.signal
}
