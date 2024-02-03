import { tl } from '@mtcute/tl'
import { TlBinaryReader, TlBinaryWriter, TlSerializationCounter } from '@mtcute/tl-runtime'

import { IKeyValueRepository } from '../../../storage/repository/key-value.js'
import { BaseService, ServiceOptions } from '../../../storage/service/base.js'
import { MtArgumentError } from '../../../types/index.js'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import { extractUsernames } from '../../utils/peer-utils.js'

export interface CurrentUserInfo {
    userId: number
    isBot: boolean
    isPremium: boolean
    usernames: string[]
}

const KV_CURRENT_USER = 'current_user'

function serialize(info: CurrentUserInfo | null): Uint8Array {
    if (!info) return new Uint8Array(0)

    const hasUsernames = info.usernames.length > 0

    let usernamesOverhead = hasUsernames ? 4 : 0

    for (const username of info.usernames) {
        // since usernames are always ASCII, string length is the same as byte length
        usernamesOverhead += TlSerializationCounter.countBytesOverhead(username.length) + username.length
    }

    const writer = TlBinaryWriter.manual(16 + usernamesOverhead)
    writer.int(1) // version

    let flags = 0
    if (info.isBot) flags |= 1
    if (hasUsernames) flags |= 2
    if (info.isPremium) flags |= 4

    writer.int(flags)
    writer.int53(info.userId)

    if (hasUsernames) {
        writer.int(info.usernames.length)

        for (const username of info.usernames) {
            writer.string(username)
        }
    }

    return writer.result()
}

function parse(data: Uint8Array): CurrentUserInfo | null {
    if (data.length === 0) return null

    const reader = TlBinaryReader.manual(data)
    if (reader.int() !== 1) return null

    const flags = reader.int()
    const userId = reader.int53()

    let usernames: string[] = []

    if (flags & 2) {
        const len = reader.int()
        usernames = new Array<string>(len)

        for (let i = 0; i < len; i++) {
            usernames[i] = reader.string()
        }
    }

    return {
        userId,
        isBot: (flags & 1) !== 0,
        isPremium: (flags & 4) !== 0,
        usernames,
    }
}

// todo: add testMode here

export class CurrentUserService extends BaseService {
    constructor(
        private _kv: IKeyValueRepository,
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

    async storeFrom(user: tl.TypeUser): Promise<CurrentUserInfo> {
        assertTypeIs('storeFrom', user, 'user')

        const obj: CurrentUserInfo = {
            userId: user.id,
            isBot: user.bot!,
            isPremium: user.premium!,
            usernames: extractUsernames(user),
        }
        await this.store(obj)

        return obj
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

    async update(params: { username?: string; usernames?: string[]; isPremium?: boolean }): Promise<void> {
        const info = await this.fetch()
        if (!info) return

        const { username, usernames, isPremium } = params

        if (isPremium !== undefined) info.isPremium = isPremium

        if (username !== undefined) {
            // "main" username is always the first one
            info.usernames[0] = username
        } else if (usernames !== undefined) {
            info.usernames = usernames
        }

        return this.store(info)
    }
}
