/* eslint-disable @typescript-eslint/no-unsafe-return */
import { tl } from '@mtcute/tl'
import { base64DecodeToBuffer, base64Encode } from '@mtcute/tl-runtime'

import { longFromFastString, longToFastString } from '../utils/long-utils.js'
import { MemorySessionState, MemoryStorage } from './memory.js'

/**
 * Helper class that provides json serialization functions
 * to the session.
 */
export class JsonMemoryStorage extends MemoryStorage {
    protected _loadJson(json: string): void {
        this._setStateFrom(
            JSON.parse(json, (key, value) => {
                switch (key) {
                    case 'authKeys':
                    case 'authKeysTemp': {
                        const ret: Record<string, Uint8Array> = {}

                        ;(value as string).split('|').forEach((pair: string) => {
                            const [dcId, b64] = pair.split(',')
                            ret[dcId] = base64DecodeToBuffer(b64)
                        })

                        return ret
                    }
                    case 'authKeysTempExpiry':
                    case 'entities':
                    case 'phoneIndex':
                    case 'usernameIndex':
                    case 'pts':
                    case 'fsm':
                    case 'rl':
                        return new Map(Object.entries(value as Record<string, string>))
                    case 'accessHash':
                        return longFromFastString(value as string)
                }

                return value
            }) as MemorySessionState,
        )
    }

    protected _saveJson(): string {
        return JSON.stringify(this._state, (key, value) => {
            switch (key) {
                case 'authKeys':
                case 'authKeysTemp': {
                    const value_ = value as Map<string, Uint8Array | null>

                    return [...value_.entries()]
                        .filter((it): it is [string, Uint8Array] => it[1] !== null)
                        .map(([dcId, key]) => dcId + ',' + base64Encode(key))
                        .join('|')
                }
                case 'authKeysTempExpiry':
                case 'entities':
                case 'phoneIndex':
                case 'usernameIndex':
                case 'pts':
                case 'fsm':
                case 'rl':
                    return Object.fromEntries([...(value as Map<string, string>).entries()])
                case 'accessHash':
                    return longToFastString(value as tl.Long)
            }

            return value
        })
    }
}
