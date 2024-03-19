import { getPlatform } from '../../platform.js'
import { BaseStorageDriver } from '../driver.js'
import { ISqliteDatabase, ISqliteStatement } from './types.js'

const MIGRATIONS_TABLE_NAME = 'mtcute_migrations'
const MIGRATIONS_TABLE_SQL = `
create table if not exists ${MIGRATIONS_TABLE_NAME} (
    repo text not null primary key,
    version integer not null
);
`.trim()

type MigrationFunction = (db: ISqliteDatabase) => void

export abstract class BaseSqliteStorageDriver extends BaseStorageDriver {
    db!: ISqliteDatabase

    private _pending: [ISqliteStatement, unknown[]][] = []
    private _runMany!: (stmts: [ISqliteStatement, unknown[]][]) => void
    private _cleanup?: () => void

    private _migrations: Map<string, Map<number, MigrationFunction>> = new Map()
    private _maxVersion: Map<string, number> = new Map()

    // todo: remove in 1.0.0
    private _legacyMigrations: Map<string, MigrationFunction> = new Map()

    registerLegacyMigration(repo: string, migration: MigrationFunction): void {
        if (this.loaded) {
            throw new Error('Cannot register migrations after loading')
        }

        this._legacyMigrations.set(repo, migration)
    }

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

    private _onLoad = new Set<(db: ISqliteDatabase) => void>()

    onLoad(cb: (db: ISqliteDatabase) => void): void {
        if (this.loaded) {
            cb(this.db)
        } else {
            this._onLoad.add(cb)
        }
    }

    _writeLater(stmt: ISqliteStatement, params: unknown[]): void {
        this._pending.push([stmt, params])
    }

    private _runLegacyMigrations = false

    _initialize(): void {
        const hasLegacyTables = this.db
            .prepare("select name from sqlite_master where type = 'table' and name = 'kv'")
            .get()

        if (hasLegacyTables) {
            this._log.info('legacy tables detected, will run migrations')
            this._runLegacyMigrations = true
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

    abstract _createDatabase(): ISqliteDatabase

    _load(): void {
        this.db = this._createDatabase()

        this._runMany = this.db.transaction((stmts: [ISqliteStatement, unknown[]][]) => {
            stmts.forEach((stmt) => {
                stmt[0].run(stmt[1])
            })
        })

        this.db.transaction(() => this._initialize())()

        this._cleanup = getPlatform().beforeExit(() => {
            this._save()
            this._destroy()
        })
        for (const cb of this._onLoad) cb(this.db)

        if (this._runLegacyMigrations) {
            this.db.transaction(() => {
                for (const migration of this._legacyMigrations.values()) {
                    migration(this.db)
                }

                // in case _writeLater was used
                this._runMany(this._pending)
            })()
        }
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
