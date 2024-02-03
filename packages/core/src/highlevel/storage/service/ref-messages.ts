import { BaseService, ServiceOptions } from '../../../storage/service/base.js'
import { LruMap } from '../../../utils/lru-map.js'
import { IReferenceMessagesRepository } from '../repository/ref-messages.js'

export interface RefMessagesServiceOptions {
    cacheSize?: number
}

// todo: move inside updates manager?
// todo: chatId -> channelId

export class RefMessagesService extends BaseService {
    private _cache: LruMap<number, [number, number]>

    constructor(
        readonly options: RefMessagesServiceOptions,
        readonly _refs: IReferenceMessagesRepository,
        common: ServiceOptions,
    ) {
        super(common)

        this._cache = new LruMap(options.cacheSize ?? 1000)
    }

    async store(peerId: number, chatId: number, msgId: number): Promise<void> {
        await this._refs.store(peerId, chatId, msgId)
        this._cache.set(peerId, [chatId, msgId])
    }

    async getForPeer(peerId: number): Promise<[number, number] | null> {
        const cached = this._cache.get(peerId)
        if (cached) return cached

        const ref = await this._refs.getByPeer(peerId)
        if (ref) this._cache.set(peerId, ref)

        return ref
    }

    async delete(chatId: number, msgIds: number[]): Promise<void> {
        await this._refs.delete(chatId, msgIds)
        // it's too expensive to invalidate the cache,
        // so we just clear it completely instead
        this._cache.clear()
    }

    async deleteByPeer(peerId: number): Promise<void> {
        await this._refs.deleteByPeer(peerId)
        this._cache.delete(peerId)
    }
}
