import { IStateStorage } from '@mtcute/dispatcher'
import { tl } from '@mtcute/tl'

import { LruMap, toggleChannelIdMark } from '../utils/index.js'
import { ITelegramStorage } from './abstract.js'

const CURRENT_VERSION = 1

type PeerInfoWithUpdated = ITelegramStorage.PeerInfo & { updated: number }

export interface MemorySessionState {
    // forwards compatibility for persistent storages
    $version: typeof CURRENT_VERSION

    defaultDcs: ITelegramStorage.DcOptions | null
    authKeys: Map<number, Uint8Array>
    authKeysTemp: Map<string, Uint8Array>
    authKeysTempExpiry: Map<string, number>

    // marked peer id -> entity info
    entities: Map<number, PeerInfoWithUpdated>
    // phone number -> peer id
    phoneIndex: Map<string, number>
    // username -> peer id
    usernameIndex: Map<string, number>

    // common pts, date, seq, qts
    gpts: [number, number, number, number] | null
    // channel pts
    pts: Map<number, number>

    // state for fsm
    fsm: Map<
        string,
        {
            // value
            v: unknown
            // expires
            e?: number
        }
    >

    // state for rate limiter
    rl: Map<
        string,
        {
            // reset
            res: number
            // remaining
            rem: number
        }
    >

    self: ITelegramStorage.SelfInfo | null
}

const USERNAME_TTL = 86400000 // 24 hours

export class MemoryStorage implements ITelegramStorage, IStateStorage {
    protected _state!: MemorySessionState
    private _cachedInputPeers: LruMap<number, tl.TypeInputPeer> = new LruMap(100)

    private _cachedFull: LruMap<number, tl.TypeUser | tl.TypeChat>

    private _vacuumTimeout?: NodeJS.Timeout
    private _vacuumInterval: number

    constructor(params?: {
        /**
         * Maximum number of cached full entities.
         *
         * Note that full entities are **NOT** persisted
         * to the disk (in case this storage is backed
         * by a local storage), and only available within
         * the current runtime.
         *
         * @default  `100`, use `0` to disable
         */
        cacheSize?: number

        /**
         * Interval in milliseconds for vacuuming the storage.
         *
         * When vacuuming, the storage will remove expired FSM
         * states to reduce memory usage.
         *
         * @default  `300_000` (5 minutes)
         */
        vacuumInterval?: number
    }) {
        this.reset()
        this._cachedFull = new LruMap(params?.cacheSize ?? 100)
        this._vacuumInterval = params?.vacuumInterval ?? 300_000
    }

    load(): void {
        this._vacuumTimeout = setInterval(this._vacuum.bind(this), this._vacuumInterval)
    }

    destroy(): void {
        clearInterval(this._vacuumTimeout)
    }

    reset(): void {
        this._state = {
            $version: CURRENT_VERSION,
            defaultDcs: null,
            authKeys: new Map(),
            authKeysTemp: new Map(),
            authKeysTempExpiry: new Map(),
            entities: new Map(),
            phoneIndex: new Map(),
            usernameIndex: new Map(),
            gpts: null,
            pts: new Map(),
            fsm: new Map(),
            rl: new Map(),
            self: null,
        }
    }

    /**
     * Set a given object as an underlying state.
     *
     * Note that this object will be used as-is, so if
     * you plan on using it somewhere else, be sure to copy it beforehand.
     */
    protected _setStateFrom(obj: MemorySessionState): void {
        if (obj.$version !== CURRENT_VERSION) return

        // populate indexes if needed
        let populate = false

        if (!obj.phoneIndex?.size) {
            obj.phoneIndex = new Map()
            populate = true
        }
        if (!obj.usernameIndex?.size) {
            obj.usernameIndex = new Map()
            populate = true
        }

        if (populate) {
            Object.values(obj.entities).forEach((ent: ITelegramStorage.PeerInfo) => {
                if (ent.phone) obj.phoneIndex.set(ent.phone, ent.id)

                if (ent.username) {
                    obj.usernameIndex.set(ent.username, ent.id)
                }
            })
        }

        this._state = obj
    }

    private _vacuum(): void {
        // remove expired entities from fsm and rate limit storages

        const now = Date.now()

        // make references in advance to avoid lookups
        const state = this._state
        const fsm = state.fsm
        const rl = state.rl

        for (const [key, item] of fsm) {
            if (item.e && item.e < now) {
                fsm.delete(key)
            }
        }

        for (const [key, item] of rl) {
            if (item.res < now) {
                rl.delete(key)
            }
        }
    }

    getDefaultDcs(): ITelegramStorage.DcOptions | null {
        return this._state.defaultDcs
    }

    setDefaultDcs(dcs: ITelegramStorage.DcOptions | null): void {
        this._state.defaultDcs = dcs
    }

    setTempAuthKeyFor(dcId: number, index: number, key: Uint8Array | null, expiresAt: number): void {
        const k = `${dcId}:${index}`

        if (key) {
            this._state.authKeysTemp.set(k, key)
            this._state.authKeysTempExpiry.set(k, expiresAt)
        } else {
            this._state.authKeysTemp.delete(k)
            this._state.authKeysTempExpiry.delete(k)
        }
    }

    setAuthKeyFor(dcId: number, key: Uint8Array | null): void {
        if (key) {
            this._state.authKeys.set(dcId, key)
        } else {
            this._state.authKeys.delete(dcId)
        }
    }

    getAuthKeyFor(dcId: number, tempIndex?: number): Uint8Array | null {
        if (tempIndex !== undefined) {
            const k = `${dcId}:${tempIndex}`

            if (Date.now() > (this._state.authKeysTempExpiry.get(k) ?? 0)) {
                return null
            }

            return this._state.authKeysTemp.get(k) ?? null
        }

        return this._state.authKeys.get(dcId) ?? null
    }

    dropAuthKeysFor(dcId: number): void {
        this._state.authKeys.delete(dcId)

        for (const key of this._state.authKeysTemp.keys()) {
            if (key.startsWith(`${dcId}:`)) {
                this._state.authKeysTemp.delete(key)
                this._state.authKeysTempExpiry.delete(key)
            }
        }
    }

    updatePeers(peers: PeerInfoWithUpdated[]): void {
        for (const peer of peers) {
            this._cachedFull.set(peer.id, peer.full)

            peer.updated = Date.now()
            const old = this._state.entities.get(peer.id)

            if (old) {
                // delete old index entries if needed
                if (old.username && peer.username !== old.username) {
                    this._state.usernameIndex.delete(old.username)
                }
                if (old.phone && old.phone !== peer.phone) {
                    this._state.phoneIndex.delete(old.phone)
                }
            }

            if (peer.username) {
                this._state.usernameIndex.set(peer.username, peer.id)
            }

            if (peer.phone) this._state.phoneIndex.set(peer.phone, peer.id)

            this._state.entities.set(peer.id, peer)
        }
    }

    protected _getInputPeer(peerInfo?: ITelegramStorage.PeerInfo): tl.TypeInputPeer | null {
        if (!peerInfo) return null

        switch (peerInfo.type) {
            case 'user':
                return {
                    _: 'inputPeerUser',
                    userId: peerInfo.id,
                    accessHash: peerInfo.accessHash,
                }
            case 'chat':
                return {
                    _: 'inputPeerChat',
                    chatId: -peerInfo.id,
                }
            case 'channel':
                return {
                    _: 'inputPeerChannel',
                    channelId: toggleChannelIdMark(peerInfo.id),
                    accessHash: peerInfo.accessHash,
                }
        }
    }

    getPeerById(peerId: number): tl.TypeInputPeer | null {
        if (this._cachedInputPeers.has(peerId)) {
            return this._cachedInputPeers.get(peerId)!
        }
        const peer = this._getInputPeer(this._state.entities.get(peerId))
        if (peer) this._cachedInputPeers.set(peerId, peer)

        return peer
    }

    getPeerByPhone(phone: string): tl.TypeInputPeer | null {
        const peerId = this._state.phoneIndex.get(phone)
        if (!peerId) return null

        return this._getInputPeer(this._state.entities.get(peerId))
    }

    getPeerByUsername(username: string): tl.TypeInputPeer | null {
        const id = this._state.usernameIndex.get(username.toLowerCase())
        if (!id) return null
        const peer = this._state.entities.get(id)
        if (!peer) return null

        if (Date.now() - peer.updated > USERNAME_TTL) return null

        return this._getInputPeer(peer)
    }

    getSelf(): ITelegramStorage.SelfInfo | null {
        return this._state.self
    }

    setSelf(self: ITelegramStorage.SelfInfo | null): void {
        this._state.self = self
    }

    setManyChannelPts(values: Map<number, number>): void {
        for (const [id, pts] of values) {
            this._state.pts.set(id, pts)
        }
    }

    getChannelPts(entityId: number): number | null {
        return this._state.pts.get(entityId) ?? null
    }

    getUpdatesState(): [number, number, number, number] | null {
        return this._state.gpts ?? null
    }

    setUpdatesPts(val: number): void {
        if (!this._state.gpts) this._state.gpts = [0, 0, 0, 0]
        this._state.gpts[0] = val
    }

    setUpdatesQts(val: number): void {
        if (!this._state.gpts) this._state.gpts = [0, 0, 0, 0]
        this._state.gpts[1] = val
    }

    setUpdatesDate(val: number): void {
        if (!this._state.gpts) this._state.gpts = [0, 0, 0, 0]
        this._state.gpts[2] = val
    }

    setUpdatesSeq(val: number): void {
        if (!this._state.gpts) this._state.gpts = [0, 0, 0, 0]
        this._state.gpts[3] = val
    }

    getFullPeerById(id: number): tl.TypeUser | tl.TypeChat | null {
        return this._cachedFull.get(id) ?? null
    }

    // IStateStorage implementation

    getState(key: string): unknown {
        const val = this._state.fsm.get(key)
        if (!val) return null

        if (val.e && val.e < Date.now()) {
            // expired
            this._state.fsm.delete(key)

            return null
        }

        return val.v
    }

    setState(key: string, state: unknown, ttl?: number): void {
        this._state.fsm.set(key, {
            v: state,
            e: ttl ? Date.now() + ttl * 1000 : undefined,
        })
    }

    deleteState(key: string): void {
        this._state.fsm.delete(key)
    }

    getCurrentScene(key: string): string | null {
        return this.getState(`$current_scene_${key}`) as string | null
    }

    setCurrentScene(key: string, scene: string, ttl?: number): void {
        return this.setState(`$current_scene_${key}`, scene, ttl)
    }

    deleteCurrentScene(key: string): void {
        this._state.fsm.delete(`$current_scene_${key}`)
    }

    getRateLimit(key: string, limit: number, window: number): [number, number] {
        // leaky bucket
        const now = Date.now()

        const item = this._state.rl.get(key)

        if (!item) {
            const state = {
                res: now + window * 1000,
                rem: limit,
            }

            this._state.rl.set(key, state)

            return [state.rem, state.res]
        }

        if (item.res < now) {
            // expired

            const state = {
                res: now + window * 1000,
                rem: limit,
            }

            this._state.rl.set(key, state)

            return [state.rem, state.res]
        }

        item.rem = item.rem > 0 ? item.rem - 1 : 0

        return [item.rem, item.res]
    }

    resetRateLimit(key: string): void {
        this._state.rl.delete(key)
    }
}
