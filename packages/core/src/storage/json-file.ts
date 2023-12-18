// eslint-disable-next-line no-restricted-imports
import * as fs from 'fs'

import { beforeExit } from '../utils/index.js'
import { JsonMemoryStorage } from './json.js'

/**
 * mtcute storage that stores data in a JSON file.
 *
 * > **Note**: This storage is **not fully persistent**, meaning that
 * > some data *will* be lost on restart, including entities cache,
 * > FSM and rate limiter states, because JSON file would be too large otherwise.
 * >
 * > This storage should only be used for testing purposes,
 * > and should not be used in production. Use e.g. `@mtcute/sqlite` instead.
 *
 * @deprecated
 */
export class JsonFileStorage extends JsonMemoryStorage {
    private readonly _filename: string
    private readonly _safe: boolean
    private readonly _cleanupUnregister?: () => void

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
             * @default  `true`
             */
            safe?: boolean

            /**
             * Whether to save file on process exit.
             *
             * @default  `true`
             */
            cleanup?: boolean
        },
    ) {
        super()

        this._filename = filename
        this._safe = params?.safe ?? true

        if (params?.cleanup !== false) {
            this._cleanupUnregister = beforeExit(() => this._onProcessExit())
        }
    }

    async load(): Promise<void> {
        try {
            this._loadJson(
                await new Promise((res, rej) =>
                    fs.readFile(this._filename, 'utf-8', (err, data) => (err ? rej(err) : res(data))),
                ),
            )
        } catch (e) {}
    }

    save(): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.writeFile(this._safe ? this._filename + '.tmp' : this._filename, this._saveJson(), (err) => {
                if (err) reject(err)
                else if (this._safe) {
                    fs.rename(this._filename + '.tmp', this._filename, (err) => {
                        if (err && err.code !== 'ENOENT') reject(err)
                        else resolve()
                    })
                } else resolve()
            })
        })
    }

    private _onProcessExit(): void {
        // on exit handler must be synchronous, thus we use sync methods here
        try {
            fs.writeFileSync(this._filename, this._saveJson())
        } catch (e) {}

        if (this._safe) {
            try {
                fs.unlinkSync(this._filename + '.tmp')
            } catch (e) {}
        }
    }

    destroy(): void {
        this._cleanupUnregister?.()
    }
}
