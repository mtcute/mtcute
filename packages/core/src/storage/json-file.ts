import { JsonMemoryStorage } from './json'

let fs: any = null
try {
    fs = require('fs')
} catch (e) {}

export class JsonFileStorage extends JsonMemoryStorage {
    private readonly _filename: string

    constructor(filename: string) {
        super()
        if (!fs) throw new Error('Node fs module is not available!')

        this._filename = filename
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
            // calling writeFile immediately seems to destroy session when using debugger
            setTimeout(
                () =>
                    fs.writeFile(
                        this._filename,
                        this._saveJson(),
                        (err?: Error) => {
                            if (err) reject(err)
                            else resolve()
                        }
                    ),
                0
            )
        })
    }
}
