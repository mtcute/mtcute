import { ITelegramStorage } from './abstract'
import { MaybeAsync } from '../types'
import { tl } from '@mtcute/tl'

const CURRENT_VERSION = 1

interface MemorySessionState {
    // forwards compatibility for persistent storages
    $version: typeof CURRENT_VERSION

    defaultDc: tl.RawDcOption | null
    authKeys: Record<number, Buffer | null>

    // marked peer id -> entity info
    entities: Record<number, ITelegramStorage.PeerInfo>
    // phone number -> peer id
    phoneIndex: Record<string, number>
    // username -> peer id
    usernameIndex: Record<string, number>

    gpts: [number, number] | null
    pts: Record<number, number>

    self: ITelegramStorage.SelfInfo | null
}

const USERNAME_TTL = 86400000 // 24 hours

export class MemoryStorage implements ITelegramStorage {
    protected _state: MemorySessionState
    private _cachedInputPeers: Record<number, tl.TypeInputPeer> = {}

    constructor() {
        this.reset()
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
            self: null,
        }
    }

    /**
     * Set a given object as an underlying state.
     *
     * Note that this object will be used as-is, so if
     * you plan on using it somewhere else, be sure to copy it beforehand.
     */
    protected _setStateFrom(obj: any): void {
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
            obj.entities.forEach((ent: ITelegramStorage.PeerInfo) => {
                if (ent.phone) obj.phoneIndex[ent.phone] = ent.id
                if (ent.username) obj.usernameIndex[ent.username] = ent.id
            })
        }

        this._state = obj
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

    updatePeers(peers: ITelegramStorage.PeerInfo[]): MaybeAsync<void> {
        for (const peer of peers) {
            peer.updated = Date.now()
            const old = this._state.entities[peer.id]
            if (old) {
                // delete old index entries if needed
                if (old.username && old.username !== peer.username) {
                    delete this._state.usernameIndex[old.username]
                }
                if (old.phone && old.phone !== peer.phone) {
                    delete this._state.phoneIndex[old.phone]
                }
            }

            if (peer.username)
                this._state.usernameIndex[peer.username] = peer.id
            if (peer.phone) this._state.phoneIndex[peer.phone] = peer.id
            this._state.entities[peer.id] = peer
        }
    }

    getPeerById(peerId: number): tl.TypeInputPeer | null {
        if (peerId in this._cachedInputPeers)
            return this._cachedInputPeers[peerId]
        const peer = ITelegramStorage.getInputPeer(this._state.entities[peerId])
        if (peer) this._cachedInputPeers[peerId] = peer
        return peer
    }

    getPeerByPhone(phone: string): tl.TypeInputPeer | null {
        return ITelegramStorage.getInputPeer(
            this._state.entities[this._state.phoneIndex[phone]]
        )
    }

    getPeerByUsername(username: string): tl.TypeInputPeer | null {
        const id = this._state.usernameIndex[username]
        if (!id) return null
        const peer = this._state.entities[id]
        if (!peer) return null

        if (Date.now() - peer.updated > USERNAME_TTL) return null

        return ITelegramStorage.getInputPeer(peer)
    }

    getSelf(): ITelegramStorage.SelfInfo | null {
        return this._state.self
    }

    setSelf(self: ITelegramStorage.SelfInfo | null): void {
        this._state.self = self
    }

    setChannelPts(entityId: number, pts: number | null): void {
        if (pts !== null) {
            this._state.pts[entityId] = pts
        } else {
            delete this._state.pts[entityId]
        }
    }

    getChannelPts(entityId: number): number | null {
        return this._state.pts[entityId] ?? null
    }

    setCommonPts(val: [number | null, number | null] | null): void {
        if (val) {
            if (this._state.gpts) {
                if (val[0] === null) val[0] = this._state.gpts[0]
                if (val[1] === null) val[1] = this._state.gpts[1]
            } else {
                val = null
            }
        }
        this._state.gpts = val as [number, number] | null
    }

    getCommonPts(): [number, number] | null {
        return this._state.gpts ?? null
    }
}
