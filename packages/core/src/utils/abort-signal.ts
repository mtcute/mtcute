export function combineAbortSignals(signal1: AbortSignal, signal2?: AbortSignal): AbortSignal {
  if (!signal2) return signal1

  return AbortSignal.any([signal1, signal2])
}
