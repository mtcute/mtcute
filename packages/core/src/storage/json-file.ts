import type * as fsNs from 'fs'
import { createRequire } from 'module'

import { MtUnsupportedError } from '../types/index.js'
import { JsonMemoryStorage } from './json.js'

type fs = typeof fsNs
let fs: fs | null = null

try {
    // @only-if-esm
    const require = createRequire(import.meta.url)
    // @/only-if-esm
    fs = require('fs') as fs
} catch (e) {}

const EVENTS = ['exit', 'SIGINT', 'SIGUSR1', 'SIGUSR2', 'uncaughtException', 'SIGTERM']

export class JsonFileStorage extends JsonMemoryStorage {
    private readonly _filename: string
    private readonly _safe: boolean
    private readonly _cleanup: boolean

    constructor(
        filename: string,
        params?: {
            /**
             * Whether to save file "safely", meaning that the file will first be saved
             * to `${filename}.tmp`, and then renamed to `filename`,
             * instead of writing directly to `filename`.
             *
             * This solves the issue with the storage being saved as
             * a blank file because of the app being stopped while
             * the storage is being written.
             *
             * Defaults to `true`
             */
            safe?: boolean

            /**
             * Whether to save file on process exit.
             *
             * Defaults to `true`
             */
            cleanup?: boolean
        },
    ) {
        super()

        if (!fs || !fs.readFile) {
            throw new MtUnsupportedError('Node fs module is not available!')
        }

        this._filename = filename
        this._safe = params?.safe ?? true
        this._cleanup = params?.cleanup ?? true

        if (this._cleanup) {
            this._onProcessExit = this._onProcessExit.bind(this)
            EVENTS.forEach((event) => process.on(event, this._onProcessExit))
        }
    }

    async load(): Promise<void> {
        try {
            this._loadJson(
                await new Promise((res, rej) =>
                    fs!.readFile(this._filename, 'utf-8', (err, data) => (err ? rej(err) : res(data))),
                ),
            )
        } catch (e) {}
    }

    save(): Promise<void> {
        return new Promise((resolve, reject) => {
            fs!.writeFile(this._safe ? this._filename + '.tmp' : this._filename, this._saveJson(), (err) => {
                if (err) reject(err)
                else if (this._safe) {
                    fs!.rename(this._filename + '.tmp', this._filename, (err) => {
                        if (err && err.code !== 'ENOENT') reject(err)
                        else resolve()
                    })
                } else resolve()
            })
        })
    }

    private _processExitHandled = false
    private _onProcessExit(): void {
        // on exit handler must be synchronous, thus we use sync methods here
        if (this._processExitHandled) return
        this._processExitHandled = true

        try {
            fs!.writeFileSync(this._filename, this._saveJson())
        } catch (e) {}

        if (this._safe) {
            try {
                fs!.unlinkSync(this._filename + '.tmp')
            } catch (e) {}
        }
    }

    destroy(): void {
        if (this._cleanup) {
            EVENTS.forEach((event) => process.off(event, this._onProcessExit))
        }
    }
}
