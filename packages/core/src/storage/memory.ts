import { ITelegramStorage } from './abstract'
import { MaybeAsync } from '../types'
import { tl } from '@mtqt/tl'
import { MAX_CHANNEL_ID } from '../utils/peer-utils'
import { LruMap } from '../utils/lru-map'

const CURRENT_VERSION = 1

type PeerInfoWithUpdated = ITelegramStorage.PeerInfo & { updated: number }

interface MemorySessionState {
    // forwards compatibility for persistent storages
    $version: typeof CURRENT_VERSION

    defaultDc: tl.RawDcOption | null
    authKeys: Record<number, Buffer | null>

    // marked peer id -> entity info
    entities: Record<number, PeerInfoWithUpdated>
    // phone number -> peer id
    phoneIndex: Record<string, number>
    // username -> peer id
    usernameIndex: Record<string, number>

    // common pts, date, seq, qts
    gpts: [number, number, number, number] | null
    // channel pts
    pts: Record<number, number>

    // state for fsm
    fsm: Record<
        string,
        {
            // value
            v: any
            // expires
            e?: number
        }
    >

    // state for rate limiter
    rl: Record<string, {
        // reset
        res: number
        // remaining
        rem: number
    }>

    self: ITelegramStorage.SelfInfo | null
}

const USERNAME_TTL = 86400000 // 24 hours

export class MemoryStorage implements ITelegramStorage /*, IStateStorage */ {
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
         * Defaults to `100`, use `0` to disable
         */
        cacheSize?: number

        /**
         * Interval in milliseconds for vacuuming the storage.
         *
         * When vacuuming, the storage will remove expired FSM
         * states to reduce memory usage.
         *
         * Defaults to `300_000` (5 minutes)
         */
        vacuumInterval?: number
    }) {
        this.reset()
        this._cachedFull = new LruMap(params?.cacheSize ?? 100)
        this._vacuumInterval = params?.vacuumInterval ?? 300_000
    }

    load(): void {
        this._vacuumTimeout = setInterval(
            this._vacuum.bind(this),
            this._vacuumInterval
        )
    }

    destroy(): void {
        clearInterval(this._vacuumTimeout!)
    }

    reset(): void {
        this._state = {
            $version: CURRENT_VERSION,
            defaultDc: null,
            authKeys: {},
            entities: {},
            phoneIndex: {},
            usernameIndex: {},
            gpts: null,
            pts: {},
            fsm: {},
            rl: {},
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
        if (!obj.phoneIndex) {
            obj.phoneIndex = {}
            populate = true
        }
        if (!obj.usernameIndex) {
            obj.usernameIndex = {}
            populate = true
        }

        if (populate) {
            Object.values(obj.entities).forEach(
                (ent: ITelegramStorage.PeerInfo) => {
                    if (ent.phone) obj.phoneIndex[ent.phone] = ent.id
                    if (ent.username) obj.usernameIndex[ent.username] = ent.id
                }
            )
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

        Object.keys(fsm).forEach((key) => {
            const exp = fsm[key].e
            if (exp && exp < now) {
                delete fsm[key]
            }
        })

        Object.keys(rl).forEach((key) => {
            if (rl[key].res < now) {
                delete rl[key]
            }
        })
    }

    getDefaultDc(): tl.RawDcOption | null {
        return this._state.defaultDc
    }

    setDefaultDc(dc: tl.RawDcOption | null): void {
        this._state.defaultDc = dc
    }

    setAuthKeyFor(dcId: number, key: Buffer | null): void {
        this._state.authKeys[dcId] = key
    }

    getAuthKeyFor(dcId: number): Buffer | null {
        return this._state.authKeys[dcId] ?? null
    }

    updatePeers(peers: PeerInfoWithUpdated[]): MaybeAsync<void> {
        for (const peer of peers) {
            this._cachedFull.set(peer.id, peer.full)

            peer.updated = Date.now()
            const old = this._state.entities[peer.id]
            if (old) {
                // min peer
                // if (peer.fromMessage) continue

                // delete old index entries if needed
                if (old.username && old.username !== peer.username) {
                    delete this._state.usernameIndex[old.username]
                }
                if (old.phone && old.phone !== peer.phone) {
                    delete this._state.phoneIndex[old.phone]
                }
            }

            if (peer.username)
                this._state.usernameIndex[peer.username.toLowerCase()] = peer.id
            if (peer.phone) this._state.phoneIndex[peer.phone] = peer.id
            this._state.entities[peer.id] = peer
        }
    }

    protected _getInputPeer(
        peerInfo?: ITelegramStorage.PeerInfo
    ): tl.TypeInputPeer | null {
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
                    channelId: MAX_CHANNEL_ID - peerInfo.id,
                    accessHash: peerInfo.accessHash,
                }
        }

        throw new Error(`Invalid peer type: ${peerInfo.type}`)
    }

    getPeerById(peerId: number): tl.TypeInputPeer | null {
        if (this._cachedInputPeers.has(peerId))
            return this._cachedInputPeers.get(peerId)!
        const peer = this._getInputPeer(this._state.entities[peerId])
        if (peer) this._cachedInputPeers.set(peerId, peer)
        return peer
    }

    getPeerByPhone(phone: string): tl.TypeInputPeer | null {
        return this._getInputPeer(
            this._state.entities[this._state.phoneIndex[phone]]
        )
    }

    getPeerByUsername(username: string): tl.TypeInputPeer | null {
        const id = this._state.usernameIndex[username.toLowerCase()]
        if (!id) return null
        const peer = this._state.entities[id]
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

    setManyChannelPts(values: Record<number, number>): void {
        Object.keys(values).forEach((id: any) => {
            this._state.pts[id] = values[id]
        })
    }

    getChannelPts(entityId: number): number | null {
        return this._state.pts[entityId] ?? null
    }

    getUpdatesState(): MaybeAsync<[number, number, number, number] | null> {
        return this._state.gpts ?? null
    }

    setUpdatesPts(val: number): MaybeAsync<void> {
        if (!this._state.gpts) this._state.gpts = [0, 0, 0, 0]
        this._state.gpts[0] = val
    }

    setUpdatesQts(val: number): MaybeAsync<void> {
        if (!this._state.gpts) this._state.gpts = [0, 0, 0, 0]
        this._state.gpts[1] = val
    }

    setUpdatesDate(val: number): MaybeAsync<void> {
        if (!this._state.gpts) this._state.gpts = [0, 0, 0, 0]
        this._state.gpts[2] = val
    }

    setUpdatesSeq(val: number): MaybeAsync<void> {
        if (!this._state.gpts) this._state.gpts = [0, 0, 0, 0]
        this._state.gpts[3] = val
    }

    getFullPeerById(id: number): tl.TypeUser | tl.TypeChat | null {
        return this._cachedFull.get(id) ?? null
    }

    // IStateStorage implementation

    getState(key: string): any | null {
        const val = this._state.fsm[key]
        if (!val) return null
        if (val.e && val.e < Date.now()) {
            // expired
            delete this._state.fsm[key]
            return null
        }

        return val.v
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    setState(key: string, state: any, ttl?: number): void {
        this._state.fsm[key] = {
            v: state,
            e: ttl ? Date.now() + ttl * 1000 : undefined,
        }
    }

    deleteState(key: string): void {
        delete this._state.fsm[key]
    }

    getCurrentScene(key: string): string | null {
        return this.getState(`$current_scene_${key}`)
    }

    setCurrentScene(key: string, scene: string, ttl?: number): void {
        return this.setState(`$current_scene_${key}`, scene, ttl)
    }

    deleteCurrentScene(key: string): void {
        delete this._state.fsm[`$current_scene_${key}`]
    }

    getRateLimit(key: string, limit: number, window: number): [number, number] {
        // leaky bucket
        const now = Date.now()

        if (!(key in this._state.rl)) {
            const state = {
                res: now + window * 1000,
                rem: limit,
            }

            this._state.rl[key] = state
            return [state.rem, state.res]
        }

        const item = this._state.rl[key]
        if (item.res < now) {
            // expired

            const state = {
                res: now + window * 1000,
                rem: limit,
            }

            this._state.rl[key] = state
            return [state.rem, state.res]
        }

        item.rem = item.rem > 0 ? item.rem - 1 : 0
        return [item.rem, item.res]
    }

    resetRateLimit(key: string): void {
        delete this._state.rl[key]
    }
}
