import { tl } from '@mtcute/tl'

import { MtArgumentError } from '../../types/errors.js'
import { PublicPart } from '../../types/utils.js'
import type { CurrentUserInfo, CurrentUserService } from '../storage/service/current-user.js'
import type { PeersService } from '../storage/service/peers.js'
import { TelegramStorageManager } from '../storage/storage.js'
import { WorkerInvoker } from './invoker.js'

class CurrentUserServiceProxy implements PublicPart<CurrentUserService> {
    constructor(private _invoker: WorkerInvoker) {}
    private _bind = this._invoker.makeBinder<CurrentUserService>('storage-self')

    private _cached?: CurrentUserInfo | null

    private _store = this._bind('store')
    async store(info: CurrentUserInfo | null): Promise<void> {
        await this._store(info)
        this._cached = info
    }

    private _storeFrom = this._bind('storeFrom')
    async storeFrom(user: tl.TypeUser): Promise<CurrentUserInfo> {
        this._cached = await this._storeFrom(user)

        return this._cached
    }

    private _fetch = this._bind('fetch')
    async fetch(): Promise<CurrentUserInfo | null> {
        if (this._cached) return this._cached

        this._cached = await this._fetch()

        return this._cached
    }

    getCached(safe?: boolean): CurrentUserInfo | null {
        if (this._cached === undefined) {
            if (safe) return null

            throw new MtArgumentError('User info is not cached yet')
        }

        return this._cached
    }

    private _update = this._bind('update')
    async update(params: Parameters<CurrentUserService['update']>[0]): Promise<void> {
        await this._update(params)
        this._cached = await this._fetch()
    }
}

class PeersServiceProxy implements PublicPart<PeersService> {
    constructor(private _invoker: WorkerInvoker) {}
    private _bind = this._invoker.makeBinder<PeersService>('storage-peers')

    readonly updatePeersFrom = this._bind('updatePeersFrom')
    readonly store = this._bind('store')
    readonly getById = this._bind('getById')
    readonly getByPhone = this._bind('getByPhone')
    readonly getByUsername = this._bind('getByUsername')
    readonly getCompleteById = this._bind('getCompleteById')
}

export class TelegramStorageProxy implements PublicPart<TelegramStorageManager> {
    constructor(private _invoker: WorkerInvoker) {}

    private _bind = this._invoker.makeBinder<TelegramStorageManager>('storage')

    // todo - remove once we move these to updates manager
    readonly updates = null as never
    readonly refMsgs = null as never

    readonly self = new CurrentUserServiceProxy(this._invoker)
    readonly peers = new PeersServiceProxy(this._invoker)

    readonly clear = this._bind('clear')
}
