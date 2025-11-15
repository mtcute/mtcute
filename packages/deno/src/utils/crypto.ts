import type { IAesCtr, ICryptoProvider, IEncryptionScheme } from '@mtcute/core/utils.js'
import { Buffer } from 'node:buffer'
import { createCipheriv, createHash, createHmac, pbkdf2 } from 'node:crypto'

import { deflateSync, gunzipSync } from 'node:zlib'
import { BaseCryptoProvider } from '@mtcute/core/utils.js'
import { getWasmUrl, ige256Decrypt, ige256Encrypt, initSync } from '@mtcute/wasm'

// node:crypto is properly implemented in deno, so we can just use it
// largely just copy-pasting from @mtcute/node

function toUint8Array(buf: Buffer | Uint8Array): Uint8Array {
  if (!Buffer.isBuffer(buf)) return buf

  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
}

export class DenoCryptoProvider extends BaseCryptoProvider implements ICryptoProvider {
  async initialize(): Promise<void> {
    const wasm = await fetch(getWasmUrl()).then(res => res.arrayBuffer())
    initSync(wasm)
  }

  createAesCtr(key: Uint8Array, iv: Uint8Array): IAesCtr {
    const cipher = createCipheriv(`aes-${key.length * 8}-ctr`, key, iv)

    const update = (data: Uint8Array) => toUint8Array(cipher.update(data))

    return {
      process: update,
    }
  }

  pbkdf2(
    password: Uint8Array,
    salt: Uint8Array,
    iterations: number,
    keylen = 64,
    algo = 'sha512',
  ): Promise<Uint8Array> {
    return new Promise((resolve, reject) =>
      pbkdf2(password, salt, iterations, keylen, algo, (err: Error | null, buf: Uint8Array) =>
        err !== null ? reject(err) : resolve(toUint8Array(buf))),
    )
  }

  sha1(data: Uint8Array): Uint8Array {
    return toUint8Array(createHash('sha1').update(data).digest())
  }

  sha256(data: Uint8Array): Uint8Array {
    return toUint8Array(createHash('sha256').update(data).digest())
  }

  hmacSha256(data: Uint8Array, key: Uint8Array): Uint8Array {
    return toUint8Array(createHmac('sha256', key).update(data).digest())
  }

  createAesIge(key: Uint8Array, iv: Uint8Array): IEncryptionScheme {
    return {
      encrypt(data: Uint8Array): Uint8Array {
        return ige256Encrypt(data, key, iv)
      },
      decrypt(data: Uint8Array): Uint8Array {
        return ige256Decrypt(data, key, iv)
      },
    }
  }

  gzip(data: Uint8Array, maxSize: number): Uint8Array | null {
    try {
      // telegram accepts both zlib and gzip, but zlib is faster and has less overhead, so we use it here
      return toUint8Array(
        deflateSync(data, {
          maxOutputLength: maxSize,
        }),
      )
      // hot path, avoid additional runtime checks
    } catch (e: any) {
      if (e.code === 'ERR_BUFFER_TOO_LARGE') {
        return null
      } else if (e instanceof TypeError && e.message.includes('ERR_BUFFER_TOO_LARGE')) {
        // temporary workaround for https://github.com/denoland/deno/issues/30310
        // todo: remove after a few months
        return null
      }

      throw e
    }
  }

  gunzip(data: Uint8Array): Uint8Array {
    return toUint8Array(gunzipSync(data))
  }

  randomFill(buf: Uint8Array): void {
    crypto.getRandomValues(buf)
  }
}
