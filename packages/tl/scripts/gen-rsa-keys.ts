import { createReadStream } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import readline from 'node:readline'

import { parsePublicKey } from '@mtcute/core/utils.js'
import { NodeCryptoProvider } from '@mtcute/node/utils.js'

import type { TlPublicKey } from '../binary/rsa-keys.js'

import { ESM_PRELUDE, __dirname } from './constants.js'

const IN_TXT_FILE = join(__dirname, '../data/rsa-keys.txt')
const OUT_JS_FILE = join(__dirname, '../binary/rsa-keys.js')

interface InputKey {
    kind: 'old' | 'new'
    pem: string
}

async function* parseInputFile(): AsyncIterableIterator<InputKey> {
    const rl = readline.createInterface({
        input: createReadStream(IN_TXT_FILE),
        crlfDelay: Infinity,
    })

    let currentKind: InputKey['kind'] = 'old'

    let current = ''

    for await (const line of rl) {
        if (line === '### OLD ###') currentKind = 'old'
        if (line === '### NEW ###') currentKind = 'new'

        if (line[0] === '#') continue

        current += `${line}\n`

        if (line === '-----END RSA PUBLIC KEY-----') {
            yield {
                kind: currentKind,
                pem: current.trim(),
            }
            current = ''
        }
    }
}

async function main() {
    const crypto = new NodeCryptoProvider()
    const obj: Record<string, TlPublicKey> = {}

    for await (const key of parseInputFile()) {
        const parsed = parsePublicKey(crypto, key.pem, key.kind === 'old')
        obj[parsed.fingerprint] = parsed
    }

    await writeFile(OUT_JS_FILE, `${ESM_PRELUDE}exports.default=JSON.parse('${JSON.stringify(obj)}');`)
}

main().catch(console.error)
