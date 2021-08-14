// noinspection SqlResolve

import {
    BinaryReader,
    BinaryWriter,
    ITelegramStorage,
    LruMap,
    MAX_CHANNEL_ID,
} from '@mtcute/core'
import { tl } from '@mtcute/tl'
import sqlite3 from 'better-sqlite3'
import bigInt from 'big-integer'
import { throttle } from '@mtcute/core'
import { Logger } from '@mtcute/core/src/utils/logger'

function serializeAccessHash(hash: tl.Long): Buffer {
    const arr = hash.toArray(256)
    arr.value.push(arr.isNegative ? 1 : 0)
    return Buffer.from(arr.value)
}

function parseAccessHash(hash: Buffer): tl.Long {
    const arr = hash.toJSON().data
    return bigInt.fromArray(arr.slice(0, -1), 256, arr[arr.length - 1] as any)
}

function getInputPeer(
    row: SqliteEntity | ITelegramStorage.PeerInfo
): tl.TypeInputPeer {
    switch (row.type) {
        case 'user':
            return {
                _: 'inputPeerUser',
                userId: row.id,
                accessHash:
                    'accessHash' in row
                        ? row.accessHash
                        : parseAccessHash(row.hash),
            }
        case 'chat':
            return {
                _: 'inputPeerChat',
                chatId: -row.id,
            }
        case 'channel':
            return {
                _: 'inputPeerChannel',
                channelId: MAX_CHANNEL_ID - row.id,
                accessHash:
                    'accessHash' in row
                        ? row.accessHash
                        : parseAccessHash(row.hash),
            }
    }

    throw new Error(`Invalid peer type: ${row.type}`)
}

const CURRENT_VERSION = 1
// language=SQLite
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

    create table pts (
        channel_id integer primary key,
        pts integer not null
    );

    create table entities (
        id integer primary key,
        hash blob not null,
        type text not null,
        username text,
        phone text,
        updated integer not null,
        "full" blob
    );
    create index idx_entities_username on entities (username);
    create index idx_entities_phone on entities (phone);
`

const RESET = `
    delete from kv where key <> 'ver';
    delete from state;
    delete from auth_keys;
    delete from pts;
    delete from entities
`

const USERNAME_TTL = 86400000 // 24 hours

interface SqliteEntity {
    id: number
    hash: Buffer
    type: string
    username?: string
    phone?: string
    updated: number
    full: Buffer
}

interface CacheItem {
    peer: tl.TypeInputPeer
    full: tl.TypeUser | tl.TypeChat | null
}

interface FsmItem {
    value: any
    expires?: number
}

const STATEMENTS = {
    getKv: 'select value from kv where key = ?',
    setKv: 'insert or replace into kv (key, value) values (?, ?)',
    delKv: 'delete from kv where key = ?',

    getState: 'select value, expires from state where key = ?',
    setState:
        'insert or replace into state (key, value, expires) values (?, ?, ?)',
    delState: 'delete from state where key = ?',

    getAuth: 'select key from auth_keys where dc = ?',
    setAuth: 'insert or replace into auth_keys (dc, key) values (?, ?)',
    delAuth: 'delete from auth_keys where dc = ?',

    getPts: 'select pts from pts where channel_id = ?',
    setPts: 'insert or replace into pts (channel_id, pts) values (?, ?)',

    updateUpdated: 'update entities set updated = ? where id = ?',
    updateCachedEnt:
        'update entities set username = ?, phone = ?, updated = ?, "full" = ? where id = ?',
    upsertEnt:
        'insert or replace into entities (id, hash, type, username, phone, updated, "full") values (?, ?, ?, ?, ?, ?, ?)',
    getEntById: 'select * from entities where id = ?',
    getEntByPhone: 'select * from entities where phone = ? limit 1',
    getEntByUser: 'select * from entities where username = ? limit 1',

    delStaleState: 'delete from state where expires < ?',
} as const

const EMPTY_BUFFER = Buffer.alloc(0)

/**
 * SQLite backed storage for MTCute.
 *
 * Uses `better-sqlite3` library
 */
export class SqliteStorage implements ITelegramStorage /*, IStateStorage */ {
    private _db!: sqlite3.Database
    private _statements!: Record<keyof typeof STATEMENTS, sqlite3.Statement>
    private readonly _filename: string

    private _pending: [sqlite3.Statement, any[]][] = []
    private _pendingUnimportant: Record<number, any[]> = {}

    private _cache?: LruMap<number, CacheItem>
    private _fsmCache?: LruMap<string, FsmItem>
    private _rlCache?: LruMap<string, FsmItem>

    private _wal?: boolean

    private _reader = new BinaryReader(EMPTY_BUFFER)

    private _saveUnimportantLater: () => void

    private _vacuumTimeout?: NodeJS.Timeout
    private _vacuumInterval: number

    private log!: Logger

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
             * Defaults to `100`
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
             * Defaults to `100`
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
             * Defaults to `100`
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
             * Defaults to false
             */
            disableWal?: boolean

            /**
             * Updates to already cached in-memory entities are only
             * applied in DB once in a while, to avoid redundant
             * DB calls.
             *
             * If you are having issues with this, you can set this to `0`
             *
             * Defaults to `30000` (30 sec)
             */
            unimportantSavesDelay?: number

            /**
             * Interval in milliseconds for vacuuming the storage.
             *
             * When vacuuming, the storage will remove expired FSM
             * states to reduce disk and memory usage.
             *
             * Defaults to `300_000` (5 minutes)
             */
            vacuumInterval?: number
        }
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

        this._saveUnimportantLater = throttle(() => {
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
        }, params?.unimportantSavesDelay ?? 30000)

        this._vacuumInterval = params?.vacuumInterval ?? 300_000

        // todo: add support for workers (idk if really needed, but still)
    }

    setup(log: Logger): void {
        this.log = log.create('sqlite')
    }

    private _readFullPeer(data: Buffer): tl.TypeUser | tl.TypeChat | null {
        // reuse reader because why not
        this._reader.pos = 0
        this._reader.data = data
        let obj
        try {
            obj = this._reader.object()
        } catch (e) {
            // object might be from an older tl layer, in which case
            // it should be ignored (i guess?????)
            obj = null
        }
        // remove reference to allow GC-ing
        this._reader.data = EMPTY_BUFFER
        return obj
    }

    private _addToCache(id: number, item: CacheItem): void {
        if (this._cache) {
            this._cache.set(id, item)
        }
    }

    private _getFromKv(key: string): any {
        const row = this._statements.getKv.get(key)
        return row ? JSON.parse(row.value) : null
    }

    private _setToKv(key: string, value: any, now = false): void {
        const query =
            value === null ? this._statements.delKv : this._statements.setKv
        const params = value === null ? [key] : [key, JSON.stringify(value)]

        if (now) {
            query.run(params)
        } else {
            this._pending.push([query, params])
        }
    }

    private _runMany!: (stmts: [sqlite3.Statement, any[]][]) => void
    private _updateManyPeers!: (updates: any[]) => void

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private _upgradeDatabase(from: number): void {
        // not needed (yet) since no versions except 1 //
    }

    private _initializeStatements(): void {
        this._statements = {} as any
        Object.entries(STATEMENTS).forEach(([name, sql]) => {
            ;(this._statements as any)[name] = this._db.prepare(sql)
        })
    }

    private _initialize(): void {
        const hasTables = this._db
            .prepare(
                "select name from sqlite_master where type = 'table' and name = 'kv'"
            )
            .get()

        if (hasTables) {
            // tables already exist, check version
            this._initializeStatements()
            const version = this._getFromKv('ver')
            this.log.debug('current db version = %d', version)
            if (version < CURRENT_VERSION) {
                this._upgradeDatabase(version)
                this._setToKv('ver', CURRENT_VERSION, true)
            }
        } else {
            // create tables
            this.log.debug('creating tables')
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
            verbose: this.log.mgr.level === 4 ? this.log.debug : undefined,
        })

        this._initialize()

        // init wal if needed
        if (this._wal) {
            this._db.pragma('journal_mode = WAL')
        }

        // helper methods
        this._runMany = this._db.transaction((stmts) => {
            stmts.forEach((stmt: [sqlite3.Statement, any[]]) => {
                stmt[0].run(stmt[1])
            })
        })

        this._updateManyPeers = this._db.transaction((data) => {
            data.forEach((it: any[]) => {
                this._statements.updateCachedEnt.run(it)
            })
        })

        this._vacuumTimeout = setInterval(
            this._vacuum.bind(this),
            this._vacuumInterval
        )
    }

    save(): void {
        if (!this._pending.length) return

        this._runMany(this._pending)
        this._pending = []

        this._saveUnimportantLater()
    }

    destroy(): void {
        this._db.close()
        clearInterval(this._vacuumTimeout!)
    }

    reset(): void {
        this._db.exec(RESET)
    }

    setDefaultDc(dc: tl.RawDcOption | null): void {
        return this._setToKv('def_dc', dc)
    }

    getDefaultDc(): tl.RawDcOption | null {
        return this._getFromKv('def_dc')
    }

    getAuthKeyFor(dcId: number): Promise<Buffer | null> {
        const row = this._statements.getAuth.get(dcId)
        return row ? row.key : null
    }

    setAuthKeyFor(dcId: number, key: Buffer | null): void {
        this._pending.push([
            key === null ? this._statements.delAuth : this._statements.setAuth,
            key === null ? [dcId] : [dcId, key],
        ])
    }

    getSelf(): ITelegramStorage.SelfInfo | null {
        return this._getFromKv('self')
    }

    setSelf(self: ITelegramStorage.SelfInfo | null): void {
        return this._setToKv('self', self)
    }

    getUpdatesState(): [number, number, number, number] | null {
        const pts = this._getFromKv('pts')
        if (pts == null) return null

        return [
            pts,
            this._getFromKv('qts')!,
            this._getFromKv('date')!,
            this._getFromKv('seq')!,
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
        return row ? row.pts : null
    }

    setManyChannelPts(values: Record<number, number>): void {
        Object.entries(values).forEach(([cid, pts]) => {
            this._pending.push([this._statements.setPts, [cid, pts]])
        })
    }

    updatePeers(peers: ITelegramStorage.PeerInfo[]): void {
        peers.forEach((peer) => {
            const cached = this._cache?.get(peer.id)

            if (
                cached &&
                'accessHash' in cached.peer &&
                cached.peer.accessHash.eq(peer.accessHash)
            ) {
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
                    BinaryWriter.serializeObject(peer.full),
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
                        serializeAccessHash(peer.accessHash),
                        peer.type,
                        peer.username,
                        peer.phone,
                        Date.now(),
                        BinaryWriter.serializeObject(peer.full),
                    ],
                ])
                this._addToCache(peer.id, {
                    peer: getInputPeer(peer)!,
                    full: peer.full,
                })
            }
        })
    }

    getPeerById(peerId: number): tl.TypeInputPeer | null {
        const cached = this._cache?.get(peerId)
        if (cached) return cached.peer

        const row = this._statements.getEntById.get(peerId)
        if (row) {
            const peer = getInputPeer(row)
            this._addToCache(peerId, {
                peer,
                full: this._readFullPeer(row.full),
            })
            return peer
        }

        return null
    }

    getPeerByPhone(phone: string): tl.TypeInputPeer | null {
        const row = this._statements.getEntByPhone.get(phone)
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
        const row = this._statements.getEntByUser.get(username.toLowerCase())
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

        const row = this._statements.getEntById.get(id)
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

    // IStateStorage implementation

    getState(key: string, parse = true): any | null {
        let val: FsmItem | undefined = this._fsmCache?.get(key)
        const cached = val
        if (!val) {
            val = this._statements.getState.get(key)
            if (val && parse) {
                val.value = JSON.parse(val.value)
            }
        }

        if (!val) return null
        if (val.expires && val.expires < Date.now()) {
            // expired
            if (cached) {
                this._fsmCache!.delete(key)
            }
            this._statements.delState.run(key)
            return null
        }

        return val.value
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    setState(key: string, state: any, ttl?: number, parse = true): void {
        const item: FsmItem = {
            value: state,
            expires: ttl ? Date.now() + ttl * 1000 : undefined,
        }

        this._fsmCache?.set(key, item)
        this._statements.setState.run(
            key,
            parse ? JSON.stringify(item.value) : item.value,
            item.expires
        )
    }

    deleteState(key: string): void {
        this._fsmCache?.delete(key)
        this._statements.delState.run(key)
    }

    getCurrentScene(key: string): string | null {
        return this.getState(`$current_scene_${key}`, false)
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

        let val: FsmItem | undefined = this._rlCache?.get(key)
        const cached = val
        if (!val) {
            const got = this._statements.getState.get(`$rate_limit_${key}`)
            if (got) {
                val = got
            }
        }

        if (!val || val.expires! < now) {
            // expired or does not exist
            const item: FsmItem = {
                expires: now + window * 1000,
                value: limit,
            }

            this._statements.setState.run(
                `$rate_limit_${key}`,
                item.value,
                item.expires
            )
            this._rlCache?.set(key, item)

            return [item.value, item.expires!]
        }

        if (val.value > 0) {
            val.value -= 1

            this._statements.setState.run(
                `$rate_limit_${key}`,
                val.value,
                val.expires
            )
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
