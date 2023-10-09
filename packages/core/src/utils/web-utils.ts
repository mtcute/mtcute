// from https://github.com/feross/typedarray-to-buffer
// licensed under MIT
/**
 * Convert a typed array to a Buffer.
 * @param arr  Typed array to convert
 */
export function typedArrayToBuffer(arr: NodeJS.TypedArray): Buffer {
    // To avoid a copy, use the typed array's underlying ArrayBuffer to back
    // new Buffer, respecting the "view", i.e. byteOffset and byteLength
    return ArrayBuffer.isView(arr) ?
        Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength) : // Pass through all other types to `Buffer.from`
        Buffer.from(arr)
}
