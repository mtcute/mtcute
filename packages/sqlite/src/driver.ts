import sqlite3, { Database, Options, Statement } from 'better-sqlite3'

import { BaseStorageDriver, MtUnsupportedError } from '@mtcute/core'
import { beforeExit } from '@mtcute/core/utils.js'

export interface SqliteStorageDriverOptions {
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
     * Additional options to pass to `better-sqlite3`
     */
    options?: Options
}

const MIGRATIONS_TABLE_NAME = 'mtcute_migrations'
const MIGRATIONS_TABLE_SQL = `
create table if not exists ${MIGRATIONS_TABLE_NAME} (
    repo text not null primary key,
    version integer not null
);
`.trim()

type MigrationFunction = (db: Database) => void

export class SqliteStorageDriver extends BaseStorageDriver {
    db!: Database

    constructor(
        readonly filename = ':memory:',
        readonly params?: SqliteStorageDriverOptions,
    ) {
        super()
    }

    private _pending: [Statement, unknown[]][] = []
    private _runMany!: (stmts: [Statement, unknown[]][]) => void
    private _cleanup?: () => void

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

    private _onLoad = new Set<(db: Database) => void>()

    onLoad(cb: (db: Database) => void): void {
        if (this.loaded) {
            cb(this.db)
        } else {
            this._onLoad.add(cb)
        }
    }

    _writeLater(stmt: Statement, params: unknown[]): void {
        this._pending.push([stmt, params])
    }

    _initialize(): void {
        const hasLegacyTables = this.db
            .prepare("select name from sqlite_master where type = 'table' and name = 'kv'")
            .get()

        if (hasLegacyTables) {
            throw new MtUnsupportedError(
                'This database was created with an older version of mtcute, and cannot be used anymore. ' +
                    'Please delete the database and try again.',
            )
        }

        this.db.exec(MIGRATIONS_TABLE_SQL)

        const writeVersion = this.db.prepare(
            `insert or replace into ${MIGRATIONS_TABLE_NAME} (repo, version) values (?, ?)`,
        )
        const getVersion = this.db.prepare(`select version from ${MIGRATIONS_TABLE_NAME} where repo = ?`)

        const didUpgrade = new Set<string>()

        for (const repo of this._migrations.keys()) {
            const res = getVersion.get(repo) as { version: number } | undefined

            const startVersion = res?.version ?? 0
            let fromVersion = startVersion

            const migrations = this._migrations.get(repo)!
            const targetVer = this._maxVersion.get(repo)!

            while (fromVersion < targetVer) {
                const nextVersion = fromVersion + 1
                const migration = migrations.get(nextVersion)

                if (!migration) {
                    throw new Error(`No migration for ${repo} to version ${nextVersion}`)
                }

                migration(this.db)

                fromVersion = nextVersion
                didUpgrade.add(repo)
            }

            if (fromVersion !== startVersion) {
                writeVersion.run(repo, targetVer)
            }
        }
    }

    _load(): void {
        this.db = sqlite3(this.filename, {
            ...this.params?.options,
            verbose: this._log.mgr.level >= 5 ? (this._log.verbose as Options['verbose']) : undefined,
        })

        if (!this.params?.disableWal) {
            this.db.pragma('journal_mode = WAL')
        }

        this._runMany = this.db.transaction((stmts: [Statement, unknown[]][]) => {
            stmts.forEach((stmt) => {
                stmt[0].run(stmt[1])
            })
        })

        this._initialize()
        this._cleanup = beforeExit(() => {
            this._save()
            this._destroy()
        })
        for (const cb of this._onLoad) cb(this.db)
    }

    _save(): void {
        if (!this._pending.length) return

        this._runMany(this._pending)
        this._pending = []
    }

    _destroy(): void {
        this.db.close()
        this._cleanup?.()
        this._cleanup = undefined
    }
}
