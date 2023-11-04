import { InitInput } from './types.js'

export async function loadWasmBinary(input?: InitInput): Promise<WebAssembly.Instance> {
    if (typeof input === 'undefined') {
        input = new URL('../mtcute.wasm', import.meta.url)
    }

    if (
        typeof input === 'string' ||
        (typeof Request === 'function' && input instanceof Request) ||
        (typeof URL === 'function' && input instanceof URL)
    ) {
        input = await fetch(input)
    }

    if (typeof Response === 'function' && input instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                const { instance } = await WebAssembly.instantiateStreaming(input)

                return instance
            } catch (e) {
                if (input.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn(
                        '`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n',
                        e,
                    )
                } else {
                    throw e
                }
            }
        }

        const bytes = await input.arrayBuffer()

        const { instance } = await WebAssembly.instantiate(bytes)

        return instance
    }

    return await WebAssembly.instantiate(input)
}
