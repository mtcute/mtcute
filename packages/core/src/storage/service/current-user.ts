import { TlBinaryReader, TlBinaryWriter } from '@mtcute/tl-runtime'

import { MtArgumentError } from '../../types/index.js'
import { IKeyValueRepository } from '../repository/key-value.js'
import { BaseService, ServiceOptions } from './base.js'

export interface CurrentUserInfo {
    userId: number
    isBot: boolean
}

// todo: do we need this in core?

const KV_CURRENT_USER = 'current_user'

function serialize(info: CurrentUserInfo | null): Uint8Array {
    if (!info) return new Uint8Array(0)

    const writer = TlBinaryWriter.manual(16)
    writer.int(1) // version

    let flags = 0
    if (info.isBot) flags |= 1

    writer.int(flags)
    writer.int53(info.userId)

    return writer.result()
}

function parse(data: Uint8Array): CurrentUserInfo | null {
    if (data.length === 0) return null

    const reader = TlBinaryReader.manual(data)
    if (reader.int() !== 1) return null

    const flags = reader.int()
    const userId = reader.int53()

    return {
        userId,
        isBot: (flags & 1) !== 0,
    }
}

// todo: add testMode here

export class CurrentUserService extends BaseService {
    constructor(
        readonly _kv: IKeyValueRepository,
        opts: ServiceOptions,
    ) {
        super(opts)
    }

    private _cached?: CurrentUserInfo | null

    async store(info: CurrentUserInfo | null): Promise<void> {
        if (info && this._cached) {
            // update the existing object so the references to it are still valid
            if (this._cached.userId === info.userId) {
                return
            }

            this._cached.userId = info.userId
            this._cached.isBot = info.isBot
        } else {
            this._cached = info
        }

        await this._kv.set(KV_CURRENT_USER, serialize(info))
        await this._driver.save?.()
    }

    async fetch(): Promise<CurrentUserInfo | null> {
        if (this._cached) return this._cached

        const data = await this._kv.get(KV_CURRENT_USER)
        if (!data) return null

        const info = parse(data)
        this._cached = info

        return info
    }

    getCached(safe = false): CurrentUserInfo | null {
        if (this._cached === undefined) {
            if (safe) return null

            throw new MtArgumentError('User info is not cached yet')
        }

        return this._cached
    }
}
