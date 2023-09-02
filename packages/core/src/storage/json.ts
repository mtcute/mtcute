/* eslint-disable @typescript-eslint/no-unsafe-return */
import { tl } from '@mtcute/tl'

import { longFromFastString, longToFastString } from '../utils'
import { MemorySessionState, MemoryStorage } from './memory'

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

                    ;(value as string).split('|').forEach((pair: string) => {
                        const [dcId, b64] = pair.split(',')
                        ret[dcId] = Buffer.from(b64, 'base64')
                    })

                    return ret
                }

                if (key === 'accessHash') {
                    return longFromFastString(value as string)
                }

                return value
            }) as MemorySessionState,
        )
    }

    protected _saveJson(): string {
        return JSON.stringify(this._state, (key, value) => {
            if (key === 'authKeys') {
                const value_ = value as Record<string, Buffer | null>

                return Object.entries(value_)
                    .filter((it): it is [string, Buffer] => it[1] !== null)
                    .map(([dcId, key]) => dcId + ',' + key.toString('base64'))
                    .join('|')
            }
            if (key === 'accessHash') {
                return longToFastString(value as tl.Long)
            }

            return value
        })
    }
}
