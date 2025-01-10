import { BaseStorageDriver, MtUnsupportedError } from '@mtcute/core'

import { txToPromise } from './utils.js'

export type PostMigrationFunction = (db: IDBDatabase) => Promise<void>
type MigrationFunction = (db: IDBDatabase) => void | PostMigrationFunction

// <deno-insert>
// declare const indexedDB: any
// declare type IDBDatabase = any
// declare type IDBObjectStore = any
// </deno-insert>

const REPO_VERSION_PREFIX = '__version:'
const V2_MIGRATIONS_EPOCH = 2000000000000 // 18-05-2033, i sure hope that by then everyone will have upgraded :3

export class IdbStorageDriver extends BaseStorageDriver {
    db!: IDBDatabase

    constructor(readonly _dbName: string) {
        super()

        if (typeof indexedDB === 'undefined') {
            throw new MtUnsupportedError('IndexedDB is not available')
        }
    }

    private _pendingWrites: [string, unknown][] = []
    private _pendingWritesOses = new Set<string>()
    private _migrations: Map<string, Map<number, MigrationFunction>> = new Map()
    private _maxVersion: Map<string, number> = new Map()

    registerMigration(repo: string, version: number, migration: MigrationFunction): void {
        if (this.loaded) {
            throw new Error('Cannot register migrations after loading')
        }

        let map = this._migrations.get(repo)

        if (!map) {
            map = new Map()
            this._migrations.set(repo, map)
        }

        if (map.has(version)) {
            throw new Error(`Migration for ${repo} version ${version} is already registered`)
        }

        map.set(version, migration)

        const prevMax = this._maxVersion.get(repo) ?? 0

        if (version > prevMax) {
            this._maxVersion.set(repo, version)
        }
    }

    private _repoCountOverride: number | undefined
    setRepoCountOverride(repoCount: number): void {
        if (repoCount < this._maxVersion.size) {
            throw new Error(`Cannot override repo count with a lower value (we already have ${this._maxVersion.size} repos registered)`)
        }

        this._repoCountOverride = repoCount
    }

    calculateVersion(): number {
        // we calculate the version number as V2_MIGRATIONS_EPOCH + (repo_count << 8) + sum(...repo_versions)
        // this way we can also account for adding new repos in the future, and
        // have up to 512 total migrations, which is probably enough for now
        // (NB: we can't detect removed repos this way, so we will have to rely on user calling `setRepoCountOverride` to fix that)
        const repoCount = this._maxVersion.size

        let version = (this._repoCountOverride ?? repoCount) << 8

        for (const repo of this._maxVersion.keys()) {
            version += this._maxVersion.get(repo)!
        }

        return V2_MIGRATIONS_EPOCH + version
    }

    writeLater(os: string, obj: unknown): void {
        this._pendingWrites.push([os, obj])
        this._pendingWritesOses.add(os)
    }

    async _load(): Promise<void> {
        this.db = await new Promise((resolve, reject) => {
            // indexed db fucking sucks - we can't create tables once we have loaded
            // and making an ever-incrementing version number is pretty hard
            // since migrations are added dynamically.
            //
            // previously we forced the database to always emit `upgradeneeded` by passing current time,
            // but that was causing issues because it wasn't possible to open multiple connections to the same database
            // at the same time (since it would need to be upgraded)
            //
            // instead, we now use a somewhat-persistent version number that is incremented when a migration is actually needed,
            // plus an arbitrary timestamp in the future to make sure we don't break existing databases
            const req = indexedDB.open(this._dbName, this.calculateVersion())

            req.onerror = () => reject(req.error)

            const postUpgrade: PostMigrationFunction[] = []

            req.onsuccess = async () => {
                // verify that the version number is correct and we didn't have a downgrade
                const db = req.result
                if (db.version !== this.calculateVersion()) {
                    const ourRepoCount = this._maxVersion.size
                    const dbRepoCount = (db.version - V2_MIGRATIONS_EPOCH) >> 8
                    reject(new Error(`IDB version number mismatch. Did some repository get removed? If so, please use \`setRepoCountOverride\` (DB has ${dbRepoCount} repos, but we have ${ourRepoCount})`))
                }

                try {
                    for (const cb of postUpgrade) {
                        await cb(db)
                    }
                    resolve(db)
                } catch (e) {
                    reject(e)
                }
            }
            req.onupgradeneeded = () => {
                // indexed db still fucking sucks. we can't fetch anything from here,
                // since migrations must be sync, and any fetch is inherently async
                // what we do have, however, is the list of object stores.
                // we can abuse them to store the current migrations status as plain strings
                const db = req.result

                const didUpgrade = new Set<string>()

                const doUpgrade = (repo: string, fromVersion: number) => {
                    const migrations = this._migrations.get(repo)
                    if (!migrations) return

                    const targetVer = this._maxVersion.get(repo)!

                    while (fromVersion < targetVer) {
                        const nextVersion = fromVersion + 1
                        const migration = migrations.get(nextVersion)

                        if (!migration) {
                            throw new Error(`No migration for ${repo} to version ${nextVersion}`)
                        }

                        const result = migration(db)

                        if (result) {
                            // guess what? IDB still. fucking. sucks!
                            // if we want to do something except creating/removing
                            // databases, we should do this outside of migration
                            postUpgrade.push(result)
                        }

                        fromVersion = nextVersion
                    }

                    didUpgrade.add(repo)
                    db.createObjectStore(`${REPO_VERSION_PREFIX}${repo}:${targetVer}`)
                }

                for (const key of db.objectStoreNames) {
                    if (!key.startsWith(REPO_VERSION_PREFIX)) continue
                    const [, repo, version] = key.split(':')

                    const currentVer = Number(version)
                    db.deleteObjectStore(key)
                    doUpgrade(repo, currentVer)
                    didUpgrade.add(repo)
                }

                for (const repo of this._migrations.keys()) {
                    if (didUpgrade.has(repo)) continue

                    doUpgrade(repo, 0)
                }
            }
        })
    }

    async _save(): Promise<void> {
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

    _destroy(): void {
        this.db.close()
    }
}
