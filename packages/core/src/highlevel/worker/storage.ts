import type { tl } from '@mtcute/tl'

import type { PublicPart } from '../../types/utils.js'
import type { CurrentUserInfo, CurrentUserService } from '../storage/service/current-user.js'
import type { PeersService } from '../storage/service/peers.js'
import type { TelegramStorageManager } from '../storage/storage.js'
import type { WorkerInvoker } from './invoker.js'

import { MtArgumentError } from '../../types/errors.js'

class CurrentUserServiceProxy implements PublicPart<CurrentUserService> {
    private _store
    private _storeFrom
    private _fetch
    private _update

    constructor(invoker: WorkerInvoker) {
        const bind = invoker.makeBinder<CurrentUserService>('storage-self')
        this._store = bind('store')
        this._storeFrom = bind('storeFrom')
        this._fetch = bind('fetch')
        this._update = bind('update')
    }

    private _cached?: CurrentUserInfo | null

    async store(info: CurrentUserInfo | null): Promise<void> {
        await this._store(info)
        this._cached = info
    }

    async storeFrom(user: tl.TypeUser): Promise<CurrentUserInfo> {
        this._cached = await this._storeFrom(user)

        return this._cached
    }

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

    async update(params: Parameters<CurrentUserService['update']>[0]): Promise<void> {
        await this._update(params)
        this._cached = await this._fetch()
    }
}

class PeersServiceProxy implements PublicPart<PeersService> {
    readonly updatePeersFrom: PeersService['updatePeersFrom']
    readonly store: PeersService['store']
    readonly getById: PeersService['getById']
    readonly getByPhone: PeersService['getByPhone']
    readonly getByUsername: PeersService['getByUsername']
    readonly getCompleteById: PeersService['getCompleteById']
    readonly getMinAccessHash: PeersService['getMinAccessHash']
    readonly close: PeersService['close']

    constructor(private _invoker: WorkerInvoker) {
        const bind = this._invoker.makeBinder<PeersService>('storage-peers')

        this.updatePeersFrom = bind('updatePeersFrom')
        this.store = bind('store')
        this.getById = bind('getById')
        this.getByPhone = bind('getByPhone')
        this.getByUsername = bind('getByUsername')
        this.getCompleteById = bind('getCompleteById')
        this.getMinAccessHash = bind('getMinAccessHash')
        this.close = bind('close')
    }
}

export class TelegramStorageProxy implements PublicPart<TelegramStorageManager> {
    readonly self: CurrentUserServiceProxy
    readonly peers: PeersServiceProxy

    readonly clear: TelegramStorageManager['clear']
    readonly close: TelegramStorageManager['close']

    constructor(private _invoker: WorkerInvoker) {
        const bind = this._invoker.makeBinder<TelegramStorageManager>('storage')

        this.self = new CurrentUserServiceProxy(this._invoker)
        this.peers = new PeersServiceProxy(this._invoker)

        this.clear = bind('clear')
        this.close = bind('close')
    }

    // todo - remove once we move these to updates manager
    readonly updates = null as never
    readonly refMsgs = null as never
}
