import { JsonMemoryStorage } from './json'

let fs: any = null
try {
    fs = require('fs')
} catch (e) {}

let exitHook: any = null
try {
    exitHook = require('exit-hook')
} catch (e) {}

export class JsonFileStorage extends JsonMemoryStorage {
    private readonly _filename: string
    private readonly _safe: boolean
    private readonly _cleanup: boolean

    private readonly _unsubscribe?: () => void

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
             * Uses [`exit-hook`](https://www.npmjs.com/package/exit-hook)
             *
             * Defaults to `true` if `exit-hook` is installed, otherwise `false`
             */
            cleanup?: boolean
        }
    ) {
        super()
        if (!fs || !fs.readFile)
            throw new Error('Node fs module is not available!')

        this._filename = filename
        this._safe = params?.safe ?? true
        this._cleanup = params?.cleanup ?? !!exitHook

        if (this._cleanup && !exitHook) {
            throw new Error(
                'Cleanup on exit is supported through `exit-hook` library, install it first!'
            )
        }

        if (this._cleanup) {
            this._unsubscribe = exitHook(this._onProcessExit.bind(this))
        }
    }

    async load(): Promise<void> {
        try {
            this._loadJson(
                await new Promise((res, rej) =>
                    fs.readFile(
                        this._filename,
                        'utf-8',
                        (err?: Error, data?: string) =>
                            err ? rej(err) : res(data!)
                    )
                )
            )
        } catch (e) {}
    }

    save(): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.writeFile(
                this._safe ? this._filename + '.tmp' : this._filename,
                this._saveJson(),
                (err?: Error) => {
                    if (err) reject(err)
                    else if (this._safe) {
                        fs.rename(
                            this._filename + '.tmp',
                            this._filename,
                            (err?: any) => {
                                if (err && err.code !== 'ENOENT') reject(err)
                                else resolve()
                            }
                        )
                    } else resolve()
                }
            )
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
        if (this._cleanup) {
            this._unsubscribe!()
        }
    }
}
