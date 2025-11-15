export interface MtcuteWasmModule {
  memory: WebAssembly.Memory
  __malloc: (size: number) => number
  __free: (ptr: number) => void

  __get_shared_out: () => number
  __get_shared_key_buffer: () => number
  __get_shared_iv_buffer: () => number

  libdeflate_alloc_decompressor: () => number
  libdeflate_alloc_compressor: (level: number) => number

  /** @returns if !=0 - error */
  libdeflate_gzip_decompress: (ctx: number, src: number, srcLen: number, dst: number, dstLen: number) => number
  libdeflate_gzip_get_output_size: (src: number, srcLen: number) => number

  libdeflate_zlib_compress: (ctx: number, src: number, srcLen: number, dst: number, dstLen: number) => number

  ige256_encrypt: (data: number, dataLen: number, out: number) => void

  ige256_decrypt: (data: number, dataLen: number, out: number) => void

  ctr256_alloc: () => number
  ctr256_free: (ctx: number) => void
  ctr256: (ctx: number, data: number, dataLen: number, out: number) => number

  sha256: (data: number, dataLen: number) => void
  sha1: (data: number, dataLen: number) => void
}

export type SyncInitInput = BufferSource | WebAssembly.Module | WebAssembly.Instance
