import { MemoryStorage } from './memory'
import bigInt from 'big-integer'

/**
 * Helper class that provides json serialization functions
 * to the session.
 */
export class JsonMemoryStorage extends MemoryStorage {
    protected _loadJson(json: string): void {
        this._setStateFrom(
            JSON.parse(json, (key, value) => {
                if (key === 'authKeys') {
                    const ret: Record<string, Buffer> = {}

                    value.split('|').forEach((pair: string) => {
                        const [dcId, b64] = pair.split(',')
                        ret[dcId] = Buffer.from(b64, 'base64')
                    })

                    return ret
                }

                if (key === 'accessHash') {
                    return bigInt(value, 32)
                }

                return value
            })
        )
    }

    protected _saveJson(): string {
        return JSON.stringify(this._state, (key, value) => {
            if (key === 'authKeys') {
                return Object.entries(value)
                    .filter((it) => it[1] !== null)
                    .map(
                        ([dcId, key]) =>
                            dcId + ',' + (key as Buffer).toString('base64')
                    )
                    .join('|')
            }
            if (key === 'accessHash') {
                return bigInt(value).toString(32)
            }
            return value
        })
    }
}
