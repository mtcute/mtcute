import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const wasmBytes = await readFile(process.argv[2])
const { instance } = await WebAssembly.instantiate(wasmBytes)
const wasm = instance.exports
const initialMemorySize = wasm.memory.buffer.byteLength

const reusablePtr = wasm.__malloc(1024)
assert.notEqual(reusablePtr, 0)
wasm.__free(reusablePtr)

const failedPtr = wasm.__malloc(65536)
assert.equal(failedPtr, 0)
assert.equal(wasm.memory.buffer.byteLength, initialMemorySize)

const reusedPtr = wasm.__malloc(1024)
assert.equal(reusedPtr, reusablePtr)
wasm.__free(reusedPtr)

const probePtr = wasm.__malloc(0)
assert.notEqual(probePtr, 0)
wasm.__free(probePtr)

const heapTail = probePtr - 2 * Uint32Array.BYTES_PER_ELEMENT
const fillerSize = initialMemorySize - heapTail - 3 * Uint32Array.BYTES_PER_ELEMENT - 128
const fillerPtr = wasm.__malloc(fillerSize)
assert.notEqual(fillerPtr, 0)
assert.equal(wasm.ctr256_alloc(), 0)
assert.equal(wasm.memory.buffer.byteLength, initialMemorySize)
wasm.__free(fillerPtr)

const ctr = wasm.ctr256_alloc()
assert.notEqual(ctr, 0)
assert.equal(ctr % 16, 0)
wasm.ctr256_free(ctr)

process.stdout.write(
  `allocation and CTR context failures were safe; memory stayed at ${initialMemorySize} bytes\n`,
)
