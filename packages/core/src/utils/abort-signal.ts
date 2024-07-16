export function combineAbortSignals(signal1: AbortSignal, signal2?: AbortSignal): AbortSignal {
    if (!signal2) return signal1

    const controller = new AbortController()

    signal1.addEventListener('abort', () => controller.abort())
    signal2.addEventListener('abort', () => controller.abort())

    return controller.signal
}
