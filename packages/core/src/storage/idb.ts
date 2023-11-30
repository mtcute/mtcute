/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { tl } from '@mtcute/tl'
import { TlBinaryReader, TlBinaryWriter, TlReaderMap, TlWriterMap } from '@mtcute/tl-runtime'

import { Logger } from '../utils/logger.js'
import { longFromFastString, longToFastString } from '../utils/long-utils.js'
import { LruMap } from '../utils/lru-map.js'
import { toggleChannelIdMark } from '../utils/peer-utils.js'
import { ITelegramStorage } from './abstract.js'

const CURRENT_VERSION = 1

const TABLES = {
    kv: 'kv',
    state: 'state',
    authKeys: 'auth_keys',
    tempAuthKeys: 'temp_auth_keys',
    pts: 'pts',
    entities: 'entities',
    messageRefs: 'message_refs',
} as const
const EMPTY_BUFFER = new Uint8Array(0)

interface AuthKeyDto {
    dc: number
    key: Uint8Array
    expiresAt?: number
}

interface EntityDto {
    id: number
    hash: string
    type: string
    username?: string
    phone?: string
    updated: number
    full: Uint8Array
}

interface MessageRefDto {
    peerId: number
    chatId: number
    msgId: number
}

interface FsmItemDto {
    key: string
    value: string
    expires?: number
}

function txToPromise(tx: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
    })
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
    })
}

function getInputPeer(row: EntityDto | ITelegramStorage.PeerInfo): tl.TypeInputPeer {
    const id = row.id

    switch (row.type) {
        case 'user':
            return {
                _: 'inputPeerUser',
                userId: id,
                accessHash: 'accessHash' in row ? row.accessHash : longFromFastString(row.hash),
            }
        case 'chat':
            return {
                _: 'inputPeerChat',
                chatId: -id,
            }
        case 'channel':
            return {
                _: 'inputPeerChannel',
                channelId: toggleChannelIdMark(id),
                accessHash: 'accessHash' in row ? row.accessHash : longFromFastString(row.hash),
            }
    }

    throw new Error(`Invalid peer type: ${row.type}`)
}

interface CachedEntity {
    peer: tl.TypeInputPeer
    full: tl.TypeUser | tl.TypeChat | null
}

export class IdbStorage implements ITelegramStorage {
    private _cache?: LruMap<number, CachedEntity>

    private _vacuumTimeout?: NodeJS.Timeout
    private _vacuumInterval: number

    constructor(
        readonly _dbName: string,
        params?: {
            /**
             * Entities cache size, in number of entities.
             *
             * Recently encountered entities are cached in memory,
             * to avoid redundant database calls. Set to 0 to
             * disable caching (not recommended)
             *
             * Note that by design in-memory cached is only
             * used when finding peer by ID, since other
             * kinds of lookups (phone, username) may get stale quickly
             *
             * @default  `100`
             */
            cacheSize?: number

            /**
             * Updates to already cached in-memory entities are only
             * applied in DB once in a while, to avoid redundant
             * DB calls.
             *
             * If you are having issues with this, you can set this to `0`
             *
             * @default  `30000` (30 sec)
             */
            unimportantSavesDelay?: number

            /**
             * Interval in milliseconds for vacuuming the storage.
             *
             * When vacuuming, the storage will remove expired FSM
             * states to reduce disk and memory usage.
             *
             * @default  `300_000` (5 minutes)
             */
            vacuumInterval?: number
        },
    ) {
        if (params?.cacheSize !== 0) {
            this._cache = new LruMap(params?.cacheSize ?? 100)
        }

        this._vacuumInterval = params?.vacuumInterval ?? 300_000
    }

    db!: IDBDatabase

    private _upgradeDb(db: IDBDatabase, oldVer: number, newVer: number): void {
        while (oldVer < newVer) {
            switch (oldVer) {
                case 0: {
                    db.createObjectStore(TABLES.kv, { keyPath: 'key' })
                    db.createObjectStore(TABLES.authKeys, { keyPath: 'dc' })
                    db.createObjectStore(TABLES.tempAuthKeys, { keyPath: ['dc', 'idx'] })
                    db.createObjectStore(TABLES.pts, { keyPath: 'channelId' })

                    const stateOs = db.createObjectStore(TABLES.state, { keyPath: 'key' })
                    stateOs.createIndex('by_expires', 'expires')

                    const entitiesOs = db.createObjectStore(TABLES.entities, { keyPath: 'id' })
                    entitiesOs.createIndex('by_username', 'username')
                    entitiesOs.createIndex('by_phone', 'phone')

                    const msgRefsOs = db.createObjectStore(TABLES.messageRefs, { keyPath: 'peerId' })
                    msgRefsOs.createIndex('by_msg', ['chatId', 'msgId'])

                    oldVer++
                }
            }
        }

        if (newVer !== CURRENT_VERSION) throw new Error(`Invalid db version: ${newVer}`)
    }

    private log!: Logger
    private readerMap!: TlReaderMap
    private writerMap!: TlWriterMap
    private _reader!: TlBinaryReader

    setup(log: Logger, readerMap: TlReaderMap, writerMap: TlWriterMap): void {
        this.log = log.create('idb')
        this.readerMap = readerMap
        this.writerMap = writerMap
        this._reader = new TlBinaryReader(readerMap, EMPTY_BUFFER)
    }

    private _pendingWrites: [string, unknown][] = []
    private _pendingWritesOses = new Set<string>()

    private _writeLater(table: string, obj: unknown): void {
        this._pendingWrites.push([table, obj])
        this._pendingWritesOses.add(table)
    }

    private _readFullPeer(data: Uint8Array): tl.TypeUser | tl.TypeChat | null {
        this._reader = new TlBinaryReader(this.readerMap, data)
        let obj

        try {
            obj = this._reader.object()
        } catch (e) {
            // object might be from an older tl layer, in which case it will be ignored
            obj = null
        }

        return obj as tl.TypeUser | tl.TypeChat | null
    }

    async load(): Promise<void> {
        this.db = await new Promise((resolve, reject) => {
            const req = indexedDB.open(this._dbName, CURRENT_VERSION)

            req.onerror = () => reject(req.error)
            req.onsuccess = () => resolve(req.result)
            req.onupgradeneeded = (event) =>
                this._upgradeDb(req.result, event.oldVersion, event.newVersion || CURRENT_VERSION)
        })

        this._vacuumTimeout = setInterval(() => {
            this._vacuum().catch((e) => {
                this.log.warn('Failed to vacuum database: %s', e)
            })
        }, this._vacuumInterval)
    }

    async save() {
        if (this._pendingWritesOses.size === 0) return

        const writes = this._pendingWrites
        const oses = this._pendingWritesOses
        this._pendingWrites = []
        this._pendingWritesOses = new Set()

        const tx = this.db.transaction(oses, 'readwrite')

        const osMap = new Map<string, IDBObjectStore>()

        for (const table of oses) {
            osMap.set(table, tx.objectStore(table))
        }

        for (const [table, obj] of writes) {
            const os = osMap.get(table)!

            if (obj === null) {
                os.delete(table)
            } else {
                os.put(obj)
            }
        }

        await txToPromise(tx)
    }

    private async _vacuum(): Promise<void> {
        const tx = this.db.transaction(TABLES.state, 'readwrite')
        const os = tx.objectStore(TABLES.state)

        const keys = await reqToPromise(os.index('by_expires').getAllKeys(IDBKeyRange.upperBound(Date.now())))

        for (const key of keys) {
            os.delete(key)
        }

        return txToPromise(tx)
    }

    destroy(): void {
        this.db.close()
        clearInterval(this._vacuumTimeout)
    }

    async reset(withAuthKeys?: boolean | undefined): Promise<void> {
        this._cache?.clear()
        const tx = this.db.transaction(Object.values(TABLES), 'readwrite')

        for (const table of Object.values(TABLES)) {
            if (table === TABLES.authKeys && !withAuthKeys) continue
            if (table === TABLES.tempAuthKeys && !withAuthKeys) continue

            tx.objectStore(table).clear()
        }

        return txToPromise(tx)
    }

    private async _getFromKv<T>(key: string): Promise<T | null> {
        const tx = this.db.transaction(TABLES.kv)
        const store = tx.objectStore(TABLES.kv)

        const res = await reqToPromise<{ value: string }>(store.get(key))

        if (res === undefined) return null

        return JSON.parse(res.value) as T
    }

    private async _setToKv<T>(key: string, value: T, now = false): Promise<void> {
        const dto = { key, value: JSON.stringify(value) }

        if (!now) {
            this._writeLater(TABLES.kv, dto)

            return
        }

        const tx = this.db.transaction(TABLES.kv, 'readwrite')
        const store = tx.objectStore(TABLES.kv)

        await reqToPromise(store.put(dto))
    }

    setDefaultDcs(dcs: ITelegramStorage.DcOptions | null): Promise<void> {
        return this._setToKv('dcs', dcs, true)
    }

    getDefaultDcs(): Promise<ITelegramStorage.DcOptions | null> {
        return this._getFromKv('dcs')
    }

    async getAuthKeyFor(dcId: number, tempIndex?: number | undefined): Promise<Uint8Array | null> {
        let row: AuthKeyDto

        if (tempIndex !== undefined) {
            const os = this.db.transaction(TABLES.tempAuthKeys).objectStore(TABLES.tempAuthKeys)
            row = await reqToPromise<AuthKeyDto>(os.get([dcId, tempIndex]))
            if (row === undefined || row.expiresAt! < Date.now()) return null
        } else {
            const os = this.db.transaction(TABLES.authKeys).objectStore(TABLES.authKeys)
            row = await reqToPromise<AuthKeyDto>(os.get(dcId))
            if (row === undefined) return null
        }

        return row.key
    }

    async setAuthKeyFor(dcId: number, key: Uint8Array | null): Promise<void> {
        const os = this.db.transaction(TABLES.authKeys, 'readwrite').objectStore(TABLES.authKeys)

        if (key === null) {
            return reqToPromise(os.delete(dcId))
        }

        await reqToPromise(os.put({ dc: dcId, key }))
    }

    async setTempAuthKeyFor(dcId: number, index: number, key: Uint8Array | null, expiresAt: number): Promise<void> {
        const os = this.db.transaction(TABLES.tempAuthKeys, 'readwrite').objectStore(TABLES.tempAuthKeys)

        if (key === null) {
            return reqToPromise(os.delete([dcId, index]))
        }

        await reqToPromise(os.put({ dc: dcId, idx: index, key, expiresAt }))
    }

    async dropAuthKeysFor(dcId: number): Promise<void> {
        const tx = this.db.transaction([TABLES.authKeys, TABLES.tempAuthKeys], 'readwrite')

        tx.objectStore(TABLES.authKeys).delete(dcId)

        // IndexedDB sucks
        const tempOs = tx.objectStore(TABLES.tempAuthKeys)
        const keys = await reqToPromise(tempOs.getAllKeys())

        for (const key of keys) {
            if ((key as [number, number])[0] === dcId) {
                tempOs.delete(key)
            }
        }
    }

    private _cachedSelf?: ITelegramStorage.SelfInfo | null
    async getSelf(): Promise<ITelegramStorage.SelfInfo | null> {
        if (this._cachedSelf !== undefined) return this._cachedSelf

        const self = await this._getFromKv<ITelegramStorage.SelfInfo>('self')
        this._cachedSelf = self

        return self
    }

    async setSelf(self: ITelegramStorage.SelfInfo | null): Promise<void> {
        this._cachedSelf = self

        return this._setToKv('self', self, true)
    }

    async getUpdatesState(): Promise<[number, number, number, number] | null> {
        const os = this.db.transaction(TABLES.kv).objectStore(TABLES.kv)

        const [pts, qts, date, seq] = await Promise.all([
            reqToPromise<{ value: number }>(os.get('pts')),
            reqToPromise<{ value: number }>(os.get('qts')),
            reqToPromise<{ value: number }>(os.get('date')),
            reqToPromise<{ value: number }>(os.get('seq')),
        ])

        if (pts === undefined || qts === undefined || date === undefined || seq === undefined) return null

        return [Number(pts.value), Number(qts.value), Number(date.value), Number(seq.value)]
    }

    setUpdatesPts(val: number): Promise<void> {
        return this._setToKv('pts', val)
    }

    setUpdatesQts(val: number): Promise<void> {
        return this._setToKv('qts', val)
    }

    setUpdatesDate(val: number): Promise<void> {
        return this._setToKv('date', val)
    }

    setUpdatesSeq(val: number): Promise<void> {
        return this._setToKv('seq', val)
    }

    async getChannelPts(entityId: number): Promise<number | null> {
        const os = this.db.transaction(TABLES.pts).objectStore(TABLES.pts)
        const row = await reqToPromise<{ pts: number }>(os.get(entityId))

        if (row === undefined) return null

        return row.pts
    }

    async setManyChannelPts(values: Map<number, number>): Promise<void> {
        const tx = this.db.transaction(TABLES.pts, 'readwrite')
        const os = tx.objectStore(TABLES.pts)

        for (const [id, pts] of values) {
            os.put({ channelId: id, pts })
        }

        return txToPromise(tx)
    }

    updatePeers(peers: ITelegramStorage.PeerInfo[]): void {
        for (const peer of peers) {
            const dto: EntityDto = {
                id: peer.id,
                hash: longToFastString(peer.accessHash),
                type: peer.type,
                username: peer.username,
                phone: peer.phone,
                updated: Date.now(),
                full: TlBinaryWriter.serializeObject(this.writerMap, peer.full),
            }

            this._writeLater(TABLES.entities, dto)

            if (!this._cachedSelf?.isBot) {
                this._writeLater(TABLES.messageRefs, null)
            }

            this._cache?.set(peer.id, {
                peer: getInputPeer(peer),
                full: peer.full,
            })
        }
    }

    private async _findPeerByReference(os: IDBObjectStore, peerId: number): Promise<tl.TypeInputPeer | null> {
        const row = await reqToPromise<MessageRefDto>(os.get(peerId))
        if (row === undefined) return null

        const chat = await this.getPeerById(row.chatId, false)
        if (chat === null) return null

        if (peerId > 0) {
            return {
                _: 'inputPeerUserFromMessage',
                userId: peerId,
                peer: chat,
                msgId: row.msgId,
            }
        }

        return {
            _: 'inputPeerChannelFromMessage',
            channelId: toggleChannelIdMark(peerId),
            peer: chat,
            msgId: row.msgId,
        }
    }

    async getPeerById(peerId: number, allowRefs = true): Promise<tl.TypeInputPeer | null> {
        const cached = this._cache?.get(peerId)
        if (cached) return cached.peer

        const tx = this.db.transaction([TABLES.entities, TABLES.messageRefs])
        const entOs = tx.objectStore(TABLES.entities)

        const row = await reqToPromise<EntityDto>(entOs.get(peerId))

        if (row) {
            return getInputPeer(row)
        }

        if (allowRefs) {
            return this._findPeerByReference(tx.objectStore(TABLES.messageRefs), peerId)
        }

        return null
    }

    async getPeerByUsername(username: string): Promise<tl.TypeInputPeer | null> {
        const tx = this.db.transaction(TABLES.entities)
        const os = tx.objectStore(TABLES.entities)

        const row = await reqToPromise<EntityDto>(os.index('by_username').get(username))

        if (row === undefined) return null

        return getInputPeer(row)
    }

    async getPeerByPhone(phone: string): Promise<tl.TypeInputPeer | null> {
        const tx = this.db.transaction(TABLES.entities)
        const os = tx.objectStore(TABLES.entities)

        const row = await reqToPromise<EntityDto>(os.index('by_phone').get(phone))

        if (row === undefined) return null

        return getInputPeer(row)
    }

    async getFullPeerById(peerId: number): Promise<tl.TypeUser | tl.TypeChat | null> {
        const cached = this._cache?.get(peerId)
        if (cached) return cached.full

        const tx = this.db.transaction(TABLES.entities)
        const os = tx.objectStore(TABLES.entities)

        const row = await reqToPromise<EntityDto>(os.get(peerId))

        if (row === undefined) return null

        return this._readFullPeer(row.full)
    }

    async saveReferenceMessage(peerId: number, chatId: number, messageId: number): Promise<void> {
        const os = this.db.transaction(TABLES.messageRefs, 'readwrite').objectStore(TABLES.messageRefs)

        await reqToPromise(os.put({ peerId, chatId, msgId: messageId } satisfies MessageRefDto))
    }

    async deleteReferenceMessages(chatId: number, messageIds: number[]): Promise<void> {
        const tx = this.db.transaction(TABLES.messageRefs, 'readwrite')
        const os = tx.objectStore(TABLES.messageRefs)
        const index = os.index('by_msg')

        for (const msgId of messageIds) {
            const key = await reqToPromise(index.getKey([chatId, msgId]))
            if (key === undefined) continue

            os.delete(key)
        }

        return txToPromise(tx)
    }

    // IStateStorage implementation

    async getState(key: string): Promise<unknown> {
        const tx = this.db.transaction(TABLES.state, 'readwrite')
        const os = tx.objectStore(TABLES.state)

        const row = await reqToPromise<FsmItemDto>(os.get(key))
        if (!row) return null

        if (row.expires && row.expires < Date.now()) {
            await reqToPromise(os.delete(key))

            return null
        }

        return JSON.parse(row.value) as unknown
    }

    async setState(key: string, state: unknown, ttl?: number): Promise<void> {
        const tx = this.db.transaction(TABLES.state, 'readwrite')
        const os = tx.objectStore(TABLES.state)

        const dto: FsmItemDto = {
            key,
            value: JSON.stringify(state),
            expires: ttl ? Date.now() + ttl * 1000 : undefined,
        }

        await reqToPromise(os.put(dto))
    }

    async deleteState(key: string): Promise<void> {
        const tx = this.db.transaction(TABLES.state, 'readwrite')
        const os = tx.objectStore(TABLES.state)

        await reqToPromise(os.delete(key))
    }

    getCurrentScene(key: string): Promise<string | null> {
        return this.getState(`$current_scene_${key}`) as Promise<string | null>
    }

    setCurrentScene(key: string, scene: string, ttl?: number): Promise<void> {
        return this.setState(`$current_scene_${key}`, scene, ttl)
    }

    deleteCurrentScene(key: string): Promise<void> {
        return this.deleteState(`$current_scene_${key}`)
    }

    async getRateLimit(key: string, limit: number, window: number): Promise<[number, number]> {
        // leaky bucket
        const now = Date.now()

        const tx = this.db.transaction(TABLES.state, 'readwrite')
        const os = tx.objectStore(TABLES.state)

        const row = await reqToPromise<FsmItemDto>(os.get(`$rate_limit_${key}`))

        if (!row || row.expires! < now) {
            // expired or does not exist
            const dto: FsmItemDto = {
                key: `$rate_limit_${key}`,
                value: limit.toString(),
                expires: now + window * 1000,
            }
            await reqToPromise(os.put(dto))

            return [limit, dto.expires!]
        }

        let value = Number(row.value)

        if (value > 0) {
            value -= 1
            row.value = value.toString()
            await reqToPromise(os.put(row))
        }

        return [value, row.expires!]
    }

    resetRateLimit(key: string): Promise<void> {
        return this.deleteState(`$rate_limit_${key}`)
    }
}
