import Long from 'long'
import type { tl } from '@mtcute/tl'

import type { ServiceOptions } from '../../../storage/service/base.js'
import { BaseService } from '../../../storage/service/base.js'
import { longFromFastString, longToFastString } from '../../../utils/long-utils.js'
import { LruMap } from '../../../utils/lru-map.js'
import { getAllPeersFrom, parseMarkedPeerId, toggleChannelIdMark } from '../../../utils/peer-utils.js'
import { extractUsernames } from '../../utils/peer-utils.js'
import type { IPeersRepository } from '../repository/peers.js'

import type { RefMessagesService } from './ref-messages.js'

interface CacheItem {
    peer: tl.TypeInputPeer
    complete: tl.TypeUser | tl.TypeChat | null
}

export interface PeersServiceOptions {
    cacheSize?: number
    updatesWriteInterval?: number
}

const USERNAME_TTL = 24 * 60 * 60 * 1000 // 1 day

function getInputPeer(dto: IPeersRepository.PeerInfo): tl.TypeInputPeer {
    const [type, id] = parseMarkedPeerId(dto.id)

    switch (type) {
        case 'user':
            return {
                _: 'inputPeerUser',
                userId: id,
                accessHash: longFromFastString(dto.accessHash),
            }
        case 'chat':
            return {
                _: 'inputPeerChat',
                chatId: id,
            }
        case 'channel':
            return {
                _: 'inputPeerChannel',
                channelId: id,
                accessHash: longFromFastString(dto.accessHash),
            }
    }
}

export class PeersService extends BaseService {
    private _cache: LruMap<number, CacheItem>
    private _pendingWrites = new Map<number, IPeersRepository.PeerInfo>()

    constructor(
        private options: PeersServiceOptions,
        private _peers: IPeersRepository,
        private _refs: RefMessagesService,
        common: ServiceOptions,
    ) {
        super(common)

        this._cache = new LruMap(options.cacheSize ?? 100)
    }

    async updatePeersFrom(obj: tl.TlObject | tl.TlObject[]): Promise<boolean> {
        let count = 0
        let minCount = 0

        for (const peer of getAllPeersFrom(obj)) {
            if ((peer as Extract<typeof peer, { min?: unknown }>).min) {
                minCount += 1
            }

            count += 1

            await this.store(peer)
        }

        if (count > 0) {
            await this._driver.save?.()
            this._log.debug('cached %d peers (%d min)', count, minCount)

            return true
        }

        return false
    }

    async store(peer: tl.TypeUser | tl.TypeChat): Promise<void> {
        let dto: IPeersRepository.PeerInfo
        let accessHash: tl.Long

        switch (peer._) {
            case 'user': {
                if (!peer.accessHash) {
                    this._log.warn('received user without access hash: %j', peer)

                    return
                }

                dto = {
                    id: peer.id,
                    accessHash: longToFastString(peer.accessHash),
                    isMin: peer.min! && !(peer.phone !== undefined && peer.phone.length === 0),
                    phone: peer.phone,
                    usernames: extractUsernames(peer),
                    updated: Date.now(),
                    complete: this._serializeTl(peer),
                }
                accessHash = peer.accessHash
                break
            }
            case 'chat':
            case 'chatForbidden': {
                dto = {
                    id: -peer.id,
                    accessHash: '',
                    isMin: false, // chats can't be "min"
                    updated: Date.now(),
                    complete: this._serializeTl(peer),
                    usernames: [],
                }
                accessHash = Long.ZERO
                break
            }
            case 'channel':
            case 'channelForbidden': {
                if (!peer.accessHash) {
                    this._log.warn('received channel without access hash: %j', peer)

                    return
                }

                dto = {
                    id: toggleChannelIdMark(peer.id),
                    accessHash: longToFastString(peer.accessHash),
                    isMin: peer._ === 'channel' ? peer.min! : false,
                    usernames: extractUsernames(peer as tl.RawChannel),
                    updated: Date.now(),
                    complete: this._serializeTl(peer),
                }
                accessHash = peer.accessHash
                break
            }
            default:
                return
        }

        const cached = this._cache.get(peer.id)

        if (cached && this.options.updatesWriteInterval !== 0) {
            const oldAccessHash = (cached.peer as Extract<tl.TypeInputPeer, { accessHash?: unknown }>).accessHash

            if (oldAccessHash?.eq(accessHash)) {
                // when entity is cached and hash is the same, an update query is needed,
                // since some field in the full entity might have changed, or the username/phone
                //
                // to avoid too many DB calls, and since these updates are pretty common,
                // they are grouped and applied in batches no more than once every 30sec (or user-defined).
                //
                // until then, they are either served from in-memory cache,
                // or an older version is fetched from DB

                this._pendingWrites.set(peer.id, dto)
                cached.complete = peer

                return
            }
        }

        // entity is not cached in memory, or the access hash has changed
        // we need to update it in the DB asap, and also update the in-memory cache
        await this._peers.store(dto)
        this._cache.set(peer.id, {
            peer: getInputPeer(dto),
            complete: peer,
        })

        // todo: if (!this._cachedSelf?.isBot) {
        // we have the full peer, we no longer need the references
        // we can skip this in the other branch, since in that case it would've already been deleted
        await this._refs.deleteByPeer(peer.id)
    }

    private _returnCaching(id: number, dto: IPeersRepository.PeerInfo) {
        const peer = getInputPeer(dto)
        const complete = this._deserializeTl(dto.complete)

        this._cache.set(id, {
            peer,
            complete: complete as tl.TypeUser | tl.TypeChat | null,
        })

        return peer
    }

    async getById(id: number, allowRefs = true): Promise<tl.TypeInputPeer | null> {
        const cached = this._cache.get(id)
        if (cached) return cached.peer

        const dto = await this._peers.getById(id, false)

        if (dto) {
            return this._returnCaching(id, dto)
        }

        if (allowRefs) {
            const ref = await this._refs.getForPeer(id)
            if (!ref) return null

            const [chatId, msgId] = ref
            const chat = await this.getById(chatId, false)
            if (!chat) return null

            if (id > 0) {
                // user
                return {
                    _: 'inputPeerUserFromMessage',
                    peer: chat,
                    msgId,
                    userId: id,
                }
            }

            // channel
            return {
                _: 'inputPeerChannelFromMessage',
                peer: chat,
                msgId,
                channelId: toggleChannelIdMark(id),
            }
        }

        return null
    }

    async getByPhone(phone: string): Promise<tl.TypeInputPeer | null> {
        const dto = await this._peers.getByPhone(phone)
        if (!dto) return null

        return this._returnCaching(dto.id, dto)
    }

    async getByUsername(username: string): Promise<tl.TypeInputPeer | null> {
        const dto = await this._peers.getByUsername(username.toLowerCase())
        if (!dto) return null

        if (Date.now() - dto.updated > USERNAME_TTL) {
            // username is too old, we can't trust it. ask the client to re-fetch it
            return null
        }

        return this._returnCaching(dto.id, dto)
    }

    async getCompleteById(id: number, allowMin = false): Promise<tl.TypeUser | tl.TypeChat | null> {
        const cached = this._cache.get(id)
        if (cached) return cached.complete

        const dto = await this._peers.getById(id, allowMin)
        if (!dto) return null

        const cacheItem: CacheItem = {
            peer: getInputPeer(dto),
            complete: this._deserializeTl(dto.complete) as tl.TypeUser | tl.TypeChat | null,
        }
        this._cache.set(id, cacheItem)

        return cacheItem.complete
    }
}
