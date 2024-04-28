/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
import { BaseStorageDriver, MtUnsupportedError } from '@mtcute/core'

import { txToPromise } from './utils.js'

export type PostMigrationFunction = (db: IDBDatabase) => Promise<void>
type MigrationFunction = (db: IDBDatabase) => void | PostMigrationFunction

const REPO_VERSION_PREFIX = '__version:'

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
            // force the database to always emit `upgradeneeded` by passing current time
            const req = indexedDB.open(this._dbName, Date.now())

            req.onerror = () => reject(req.error)

            const postUpgrade: PostMigrationFunction[] = []

            req.onsuccess = async () => {
                try {
                    for (const cb of postUpgrade) {
                        await cb(req.result)
                    }
                    resolve(req.result)
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

    async _save() {
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
