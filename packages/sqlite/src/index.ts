// noinspection SqlResolve

import sqlite3, { Options } from 'better-sqlite3'

import { ITelegramStorage, mtp, tl, toggleChannelIdMark } from '@mtcute/core'
import {
    beforeExit,
    Logger,
    longFromFastString,
    longToFastString,
    LruMap,
    throttle,
    ThrottledFunction,
    TlBinaryReader,
    TlBinaryWriter,
    TlReaderMap,
    TlWriterMap,
} from '@mtcute/core/utils.js'

// todo: add testMode to "self"

function getInputPeer(row: SqliteEntity | ITelegramStorage.PeerInfo): tl.TypeInputPeer {
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

const CURRENT_VERSION = 5

// language=SQLite format=false
const TEMP_AUTH_TABLE = `
    create table temp_auth_keys (
        dc integer not null,
        idx integer not null,
        key blob not null,
        expires integer not null,
        primary key (dc, idx)
    );
`

// language=SQLite format=false
const MESSAGE_REFS_TABLE = `
    create table message_refs (
        peer_id integer primary key,
        chat_id integer not null,
        msg_id integer not null
    );
    create index idx_message_refs on message_refs (chat_id, msg_id);
`

// language=SQLite format=false
const SCHEMA = `
    create table kv (
        key text primary key,
        value text not null
    );

    create table state (
        key text primary key,
        value text not null,
        expires number
    );

    create table auth_keys (
        dc integer primary key,
        key blob not null
    );

    ${TEMP_AUTH_TABLE}

    create table pts (
        channel_id integer primary key,
        pts integer not null
    );

    create table entities (
        id integer primary key,
        hash text not null,
        type text not null,
        username text,
        phone text,
        updated integer not null,
        "full" blob
    );
    create index idx_entities_username on entities (username);
    create index idx_entities_phone on entities (phone);

    ${MESSAGE_REFS_TABLE}
`

// language=SQLite format=false
const RESET = `
    delete from kv where key <> 'ver';
    delete from state;
    delete from pts;
    delete from entities;
    delete from message_refs;
`
const RESET_AUTH_KEYS = `
    delete from auth_keys;
    delete from temp_auth_keys;
`

const USERNAME_TTL = 86400000 // 24 hours

interface SqliteEntity {
    id: number
    hash: string
    type: string
    username?: string
    phone?: string
    updated: number
    full: Uint8Array
}

interface CacheItem {
    peer: tl.TypeInputPeer
    full: tl.TypeUser | tl.TypeChat | null
}

interface FsmItem<T = unknown> {
    value: T
    expires?: number
}

interface MessageRef {
    peer_id: number
    chat_id: number
    msg_id: number
}

const STATEMENTS = {
    getKv: 'select value from kv where key = ?',
    setKv: 'insert or replace into kv (key, value) values (?, ?)',
    delKv: 'delete from kv where key = ?',

    getState: 'select value, expires from state where key = ?',
    setState: 'insert or replace into state (key, value, expires) values (?, ?, ?)',
    delState: 'delete from state where key = ?',

    getAuth: 'select key from auth_keys where dc = ?',
    getAuthTemp: 'select key from temp_auth_keys where dc = ? and idx = ? and expires > ?',
    setAuth: 'insert or replace into auth_keys (dc, key) values (?, ?)',
    setAuthTemp: 'insert or replace into temp_auth_keys (dc, idx, key, expires) values (?, ?, ?, ?)',
    delAuth: 'delete from auth_keys where dc = ?',
    delAuthTemp: 'delete from temp_auth_keys where dc = ? and idx = ?',
    delAllAuthTemp: 'delete from temp_auth_keys where dc = ?',

    getPts: 'select pts from pts where channel_id = ?',
    setPts: 'insert or replace into pts (channel_id, pts) values (?, ?)',

    updateUpdated: 'update entities set updated = ? where id = ?',
    updateCachedEnt: 'update entities set username = ?, phone = ?, updated = ?, "full" = ? where id = ?',
    upsertEnt:
        'insert or replace into entities (id, hash, type, username, phone, updated, "full") values (?, ?, ?, ?, ?, ?, ?)',
    getEntById: 'select * from entities where id = ?',
    getEntByPhone: 'select * from entities where phone = ? limit 1',
    getEntByUser: 'select * from entities where username = ? limit 1',

    storeMessageRef: 'insert or replace into message_refs (peer_id, chat_id, msg_id) values (?, ?, ?)',
    getMessageRef: 'select chat_id, msg_id from message_refs where peer_id = ?',
    delMessageRefs: 'delete from message_refs where chat_id = ? and msg_id = ?',
    delAllMessageRefs: 'delete from message_refs where peer_id = ?',

    delStaleState: 'delete from state where expires < ?',
} as const

const EMPTY_BUFFER = new Uint8Array(0)

/**
 * SQLite backed storage for mtcute.
 *
 * Uses `better-sqlite3` library
 */
export class SqliteStorage implements ITelegramStorage /*, IStateStorage*/ {
    private _db!: sqlite3.Database
    private _statements!: Record<keyof typeof STATEMENTS, sqlite3.Statement>
    private readonly _filename: string

    private _pending: [sqlite3.Statement, unknown[]][] = []
    private _pendingUnimportant: Record<number, unknown[]> = {}

    private _cache?: LruMap<number, CacheItem>
    private _fsmCache?: LruMap<string, FsmItem>
    private _rlCache?: LruMap<string, FsmItem>

    private _wal?: boolean

    private _reader!: TlBinaryReader

    private _saveUnimportantLater: ThrottledFunction

    private _vacuumTimeout?: NodeJS.Timeout
    private _vacuumInterval: number
    private _cleanupUnregister?: () => void

    private log!: Logger
    private readerMap!: TlReaderMap
    private writerMap!: TlWriterMap

    /**
     * @param filename  Database file name, or `:memory:` for in-memory DB
     * @param params
     */
    constructor(
        filename = ':memory:',
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
             * FSM states cache size, in number of keys.
             *
             * Recently created/fetched FSM states are cached
             * in memory to avoid redundant database calls.
             * If you are having problems with this (e.g. stale
             * state in case of concurrent accesses), you
             * can disable this by passing `0`
             *
             * @default  `100`
             */
            fsmCacheSize?: number

            /**
             * Rate limit states cache size, in number of keys.
             *
             * Recently created/used rate limits are cached
             * in memory to avoid redundant database calls.
             * If you are having problems with this (e.g. stale
             * state in case of concurrent accesses), you
             * can disable this by passing `0`
             *
             * @default  `100`
             */
            rlCacheSize?: number

            /**
             * By default, WAL mode is enabled, which
             * significantly improves performance.
             * [Learn more](https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/performance.md)
             *
             * However, you might encounter some issues,
             * and if you do, you can disable WAL by passing `true`
             *
             * @default  false
             */
            disableWal?: boolean

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

            /**
             * Whether to finalize database before exiting.
             *
             * @default  `true`
             */
            cleanup?: boolean
        },
    ) {
        this._filename = filename

        if (params?.cacheSize !== 0) {
            this._cache = new LruMap(params?.cacheSize ?? 100)
        }

        if (params?.fsmCacheSize !== 0) {
            this._fsmCache = new LruMap(params?.fsmCacheSize ?? 100)
        }

        if (params?.rlCacheSize !== 0) {
            this._rlCache = new LruMap(params?.rlCacheSize ?? 100)
        }

        this._wal = !params?.disableWal

        this._saveUnimportant = this._saveUnimportant.bind(this)
        this._saveUnimportantLater = throttle(this._saveUnimportant, params?.unimportantSavesDelay ?? 30000)

        this._vacuumInterval = params?.vacuumInterval ?? 300_000

        if (params?.cleanup !== false) {
            this._cleanupUnregister = beforeExit(() => this._destroy())
        }
    }

    setup(log: Logger, readerMap: TlReaderMap, writerMap: TlWriterMap): void {
        this.log = log.create('sqlite')
        this.readerMap = readerMap
        this.writerMap = writerMap
        this._reader = new TlBinaryReader(readerMap, EMPTY_BUFFER)
    }

    private _readFullPeer(data: Uint8Array): tl.TypeUser | tl.TypeChat | null {
        this._reader = new TlBinaryReader(this.readerMap, data)
        let obj

        try {
            obj = this._reader.object()
        } catch (e) {
            // object might be from an older tl layer, in which case
            // it should be ignored (i guess?????)
            obj = null
        }

        return obj as tl.TypeUser | tl.TypeChat | null
    }

    private _addToCache(id: number, item: CacheItem): void {
        if (this._cache) {
            this._cache.set(id, item)
        }
    }

    private _getFromKv<T>(key: string): T | null {
        const row = this._statements.getKv.get(key) as { value: string } | null

        return row ? (JSON.parse(row.value) as T) : null
    }

    private _setToKv(key: string, value: unknown, now = false): void {
        const query = value === null ? this._statements.delKv : this._statements.setKv
        const params = value === null ? [key] : [key, JSON.stringify(value)]

        if (now) {
            query.run(params)
        } else {
            this._pending.push([query, params])
        }
    }

    private _runMany!: (stmts: [sqlite3.Statement, unknown[]][]) => void
    private _updateManyPeers!: (updates: unknown[][]) => void

    private _upgradeDatabase(from: number): void {
        if (from < 2 || from > CURRENT_VERSION) {
            // 1 version was skipped during development
            // yes i am too lazy to make auto-migrations for them
            throw new Error('Unsupported session version, please migrate manually')
        }

        if (from === 2) {
            // PFS support added
            this._db.exec(TEMP_AUTH_TABLE)
            from = 3
        }

        if (from === 3) {
            // media dc support added
            const oldDc = this._db.prepare("select value from kv where key = 'def_dc'").get()

            if (oldDc) {
                const oldDcValue = JSON.parse((oldDc as { value: string }).value) as tl.RawDcOption
                this._db.prepare("update kv set value = ? where key = 'def_dc'").run([
                    JSON.stringify({
                        main: oldDcValue,
                        media: oldDcValue,
                    }),
                ])
            }
            from = 4
        }

        if (from === 4) {
            // message references support added
            this._db.exec(MESSAGE_REFS_TABLE)
            from = 5
        }

        if (from !== CURRENT_VERSION) {
            // an assertion just in case i messed up
            throw new Error('Migration incomplete')
        }
    }

    private _initializeStatements(): void {
        this._statements = {} as unknown as typeof this._statements
        Object.entries(STATEMENTS).forEach(([name, sql]) => {
            this._statements[name as keyof typeof this._statements] = this._db.prepare(sql)
        })
    }

    private _initialize(): void {
        const hasTables = this._db.prepare("select name from sqlite_master where type = 'table' and name = 'kv'").get()

        if (hasTables) {
            // tables already exist, check version
            const versionResult = this._db.prepare("select value from kv where key = 'ver'").get()
            const version = Number((versionResult as { value: number }).value)

            this.log.debug('current db version = %d', version)

            if (version < CURRENT_VERSION) {
                this._upgradeDatabase(version)
                this._db.prepare("update kv set value = ? where key = 'ver'").run(CURRENT_VERSION)
            }

            // prepared statements expect latest schema, so we need to upgrade first
            this._initializeStatements()
        } else {
            // create tables
            this.log.debug('creating tables, db version = %d', CURRENT_VERSION)
            this._db.exec(SCHEMA)
            this._initializeStatements()
            this._setToKv('ver', CURRENT_VERSION, true)
        }
    }

    private _vacuum(): void {
        this._statements.delStaleState.run(Date.now())
        // local caches aren't cleared because it would be too expensive
    }

    load(): void {
        this._db = sqlite3(this._filename, {
            verbose: this.log.mgr.level >= 5 ? (this.log.verbose as Options['verbose']) : undefined,
        })

        this._initialize()

        // init wal if needed
        if (this._wal) {
            this._db.pragma('journal_mode = WAL')
        }

        // helper methods
        this._runMany = this._db.transaction((stmts: [sqlite3.Statement, unknown[]][]) => {
            stmts.forEach((stmt) => {
                stmt[0].run(stmt[1])
            })
        })

        this._updateManyPeers = this._db.transaction((data: unknown[][]) => {
            data.forEach((it: unknown) => {
                this._statements.updateCachedEnt.run(it)
            })
        })

        this._vacuumTimeout = setInterval(this._vacuum.bind(this), this._vacuumInterval)
    }

    private _saveUnimportant() {
        // unimportant changes are changes about cached in memory entities,
        // that don't really need to be cached right away.
        // to avoid redundant DB calls, these changes are persisted
        // no more than once every 30 seconds.
        //
        // additionally, to avoid redundant changes that
        // are immediately overwritten, we use object instead
        // of an array, where the key is marked peer id,
        // and value is the arguments array, since
        // the query is always `updateCachedEnt`
        const items = Object.values(this._pendingUnimportant)
        if (!items.length) return

        this._updateManyPeers(items)
        this._pendingUnimportant = {}
    }

    save(): void {
        if (!this._pending.length) return

        this._runMany(this._pending)
        this._pending = []

        this._saveUnimportantLater()
    }

    private _destroy() {
        this._saveUnimportant()
        this._db.close()
        clearInterval(this._vacuumTimeout)
        this._saveUnimportantLater.reset()
    }

    destroy(): void {
        this._destroy()
        this._cleanupUnregister?.()
    }

    reset(withAuthKeys = false): void {
        this._db.exec(RESET)
        if (withAuthKeys) this._db.exec(RESET_AUTH_KEYS)

        this._pending = []
        this._pendingUnimportant = {}
        this._cache?.clear()
        this._fsmCache?.clear()
        this._rlCache?.clear()
        this._saveUnimportantLater.reset()
    }

    setDefaultDcs(dc: ITelegramStorage.DcOptions | null): void {
        return this._setToKv('def_dc', dc, true)
    }

    getDefaultDcs(): ITelegramStorage.DcOptions | null {
        return this._getFromKv('def_dc')
    }

    getFutureSalts(dcId: number): mtp.RawMt_future_salt[] | null {
        return (
            this._getFromKv<string[]>(`futureSalts:${dcId}`)?.map((it) => {
                const [salt, validSince, validUntil] = it.split(',')

                return {
                    _: 'mt_future_salt',
                    validSince: Number(validSince),
                    validUntil: Number(validUntil),
                    salt: longFromFastString(salt),
                }
            }) ?? null
        )
    }

    setFutureSalts(dcId: number, salts: mtp.RawMt_future_salt[]): void {
        return this._setToKv(
            `futureSalts:${dcId}`,
            salts.map((salt) => `${longToFastString(salt.salt)},${salt.validSince},${salt.validUntil}`),
            true,
        )
    }

    getAuthKeyFor(dcId: number, tempIndex?: number): Uint8Array | null {
        let row

        if (tempIndex !== undefined) {
            row = this._statements.getAuthTemp.get(dcId, tempIndex, Date.now())
        } else {
            row = this._statements.getAuth.get(dcId)
        }

        return row ? (row as { key: Uint8Array }).key : null
    }

    setAuthKeyFor(dcId: number, key: Uint8Array | null): void {
        if (key !== null) {
            this._statements.setAuth.run(dcId, key)
        } else {
            this._statements.delAuth.run(dcId)
        }
    }

    setTempAuthKeyFor(dcId: number, index: number, key: Uint8Array | null, expires: number): void {
        if (key !== null) {
            this._statements.setAuthTemp.run(dcId, index, key, expires)
        } else {
            this._statements.delAuthTemp.run(dcId, index)
        }
    }

    dropAuthKeysFor(dcId: number): void {
        this._statements.delAuth.run(dcId)
        this._statements.delAllAuthTemp.run(dcId)
    }

    private _cachedSelf?: ITelegramStorage.SelfInfo | null
    getSelf(): ITelegramStorage.SelfInfo | null {
        if (this._cachedSelf !== undefined) return this._cachedSelf

        const self = this._getFromKv<ITelegramStorage.SelfInfo | null>('self')
        this._cachedSelf = self

        return self
    }

    setSelf(self: ITelegramStorage.SelfInfo | null): void {
        this._cachedSelf = self

        return this._setToKv('self', self, true)
    }

    getUpdatesState(): [number, number, number, number] | null {
        const pts = this._getFromKv<number>('pts')
        if (pts == null) return null

        return [
            pts,
            this._getFromKv<number>('qts') ?? 0,
            this._getFromKv<number>('date') ?? 0,
            this._getFromKv<number>('seq') ?? 0,
        ]
    }

    setUpdatesPts(val: number): void {
        return this._setToKv('pts', val)
    }

    setUpdatesQts(val: number): void {
        return this._setToKv('qts', val)
    }

    setUpdatesDate(val: number): void {
        return this._setToKv('date', val)
    }

    setUpdatesSeq(val: number): void {
        return this._setToKv('seq', val)
    }

    getChannelPts(entityId: number): number | null {
        const row = this._statements.getPts.get(entityId)

        return row ? (row as { pts: number }).pts : null
    }

    setManyChannelPts(values: Map<number, number>): void {
        for (const [cid, pts] of values) {
            this._pending.push([this._statements.setPts, [cid, pts]])
        }
    }

    updatePeers(peers: ITelegramStorage.PeerInfo[]): void {
        peers.forEach((peer) => {
            const cached = this._cache?.get(peer.id)

            if (cached && 'accessHash' in cached.peer && cached.peer.accessHash.eq(peer.accessHash)) {
                // when entity is cached and hash is the same, an update query is needed,
                // since some field in the full entity might have changed, or the username/phone
                //
                // since it is cached, we know for sure that it already exists in db,
                // so we can safely use `update` instead of `insert or replace`
                //
                // to avoid too many DB calls, and since these updates are pretty common,
                // they are grouped and applied in batches no more than once every 30sec (or user-defined).
                //
                // until then, they are either served from in-memory cache,
                // or an older version is fetched from DB

                this._pendingUnimportant[peer.id] = [
                    peer.username,
                    peer.phone,
                    Date.now(),
                    TlBinaryWriter.serializeObject(this.writerMap, peer.full),
                    peer.id,
                ]
                cached.full = peer.full
            } else {
                // entity is not cached in memory, or the access hash has changed
                // we need to update it in the DB asap, and also update the in-memory cache
                this._pending.push([
                    this._statements.upsertEnt,
                    [
                        peer.id,
                        longToFastString(peer.accessHash),
                        peer.type,
                        peer.username,
                        peer.phone,
                        Date.now(),
                        TlBinaryWriter.serializeObject(this.writerMap, peer.full),
                    ],
                ])
                this._addToCache(peer.id, {
                    peer: getInputPeer(peer),
                    full: peer.full,
                })

                // we have the full peer, we no longer need the references
                // we can skip this in the other branch, since in that case it would've already been deleted
                if (!this._cachedSelf?.isBot) {
                    this._pending.push([this._statements.delAllMessageRefs, [peer.id]])
                }
            }
        })
    }

    private _findPeerByReference(peerId: number): tl.TypeInputPeer | null {
        const row = this._statements.getMessageRef.get(peerId) as MessageRef | null
        if (!row) return null

        const chat = this.getPeerById(row.chat_id, false)
        if (!chat) return null

        if (peerId > 0) {
            // user
            return {
                _: 'inputPeerUserFromMessage',
                peer: chat,
                userId: peerId,
                msgId: row.msg_id,
            }
        }

        // channel
        return {
            _: 'inputPeerChannelFromMessage',
            peer: chat,
            channelId: toggleChannelIdMark(peerId),
            msgId: row.msg_id,
        }
    }

    getPeerById(peerId: number, allowRefs = true): tl.TypeInputPeer | null {
        const cached = this._cache?.get(peerId)
        if (cached) return cached.peer

        const row = this._statements.getEntById.get(peerId) as SqliteEntity | null

        if (row) {
            const peer = getInputPeer(row)
            this._addToCache(peerId, {
                peer,
                full: this._readFullPeer(row.full),
            })

            return peer
        }

        if (allowRefs) {
            return this._findPeerByReference(peerId)
        }

        return null
    }

    getPeerByPhone(phone: string): tl.TypeInputPeer | null {
        const row = this._statements.getEntByPhone.get(phone) as SqliteEntity | null

        if (row) {
            const peer = getInputPeer(row)
            this._addToCache(row.id, {
                peer,
                full: this._readFullPeer(row.full),
            })

            return peer
        }

        return null
    }

    getPeerByUsername(username: string): tl.TypeInputPeer | null {
        const row = this._statements.getEntByUser.get(username.toLowerCase()) as SqliteEntity | null
        if (!row || Date.now() - row.updated > USERNAME_TTL) return null

        if (row) {
            const peer = getInputPeer(row)
            this._addToCache(row.id, {
                peer,
                full: this._readFullPeer(row.full),
            })

            return peer
        }

        return null
    }

    getFullPeerById(id: number): tl.TypeUser | tl.TypeChat | null {
        const cached = this._cache?.get(id)
        if (cached) return cached.full

        const row = this._statements.getEntById.get(id) as SqliteEntity | null

        if (row) {
            const full = this._readFullPeer(row.full)
            this._addToCache(id, {
                peer: getInputPeer(row),
                full,
            })

            return full
        }

        return null
    }

    saveReferenceMessage(peerId: number, chatId: number, messageId: number): void {
        this._pending.push([this._statements.storeMessageRef, [peerId, chatId, messageId]])
    }

    deleteReferenceMessages(chatId: number, messageIds: number[]): void {
        for (const id of messageIds) {
            this._pending.push([this._statements.delMessageRefs, [chatId, id]])
        }
    }

    // IStateStorage implementation

    getState(key: string, parse = true): unknown {
        let val: FsmItem | undefined = this._fsmCache?.get(key)
        const cached = val

        if (!val) {
            val = this._statements.getState.get(key) as FsmItem | undefined

            if (val && parse) {
                val.value = JSON.parse(val.value as string)
            }
        }

        if (!val) return null

        if (val.expires && val.expires < Date.now()) {
            // expired
            if (cached) {
                // hot path. if it's cached, then cache is definitely enabled

                this._fsmCache!.delete(key)
            }
            this._statements.delState.run(key)

            return null
        }

        return val.value
    }

    setState(key: string, state: unknown, ttl?: number, parse = true): void {
        const item: FsmItem = {
            value: state,
            expires: ttl ? Date.now() + ttl * 1000 : undefined,
        }

        this._fsmCache?.set(key, item)
        this._statements.setState.run(key, parse ? JSON.stringify(item.value) : item.value, item.expires)
    }

    deleteState(key: string): void {
        this._fsmCache?.delete(key)
        this._statements.delState.run(key)
    }

    getCurrentScene(key: string): string | null {
        return this.getState(`$current_scene_${key}`, false) as string | null
    }

    setCurrentScene(key: string, scene: string, ttl?: number): void {
        return this.setState(`$current_scene_${key}`, scene, ttl, false)
    }

    deleteCurrentScene(key: string): void {
        this.deleteState(`$current_scene_${key}`)
    }

    getRateLimit(key: string, limit: number, window: number): [number, number] {
        // leaky bucket
        const now = Date.now()

        let val = this._rlCache?.get(key) as FsmItem<number> | undefined
        const cached = val

        if (!val) {
            const got = this._statements.getState.get(`$rate_limit_${key}`)

            if (got) {
                val = got as FsmItem<number>
            }
        }

        // hot path. rate limit fsm entries always have an expiration date

        if (!val || val.expires! < now) {
            // expired or does not exist
            const item: FsmItem<number> = {
                expires: now + window * 1000,
                value: limit,
            }

            this._statements.setState.run(`$rate_limit_${key}`, item.value, item.expires)
            this._rlCache?.set(key, item)

            return [item.value, item.expires!]
        }

        if (val.value > 0) {
            val.value -= 1

            this._statements.setState.run(`$rate_limit_${key}`, val.value, val.expires)

            if (!cached) {
                // add to cache
                // if cached, cache is updated since `val === cached`
                this._rlCache?.set(key, val)
            }
        }

        return [val.value, val.expires!]
    }

    resetRateLimit(key: string): void {
        this._rlCache?.delete(key)
        this._statements.delState.run(`$rate_limit_${key}`)
    }
}
