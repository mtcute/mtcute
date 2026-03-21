import type { ICorePlatform, MaybePromise } from '@mtcute/core'
import type { Logger } from '@mtcute/core/utils.js'
import { BaseStorageDriver } from '@mtcute/core'

/**
 * Minimal interface for a pg-compatible client.
 * Satisfied by `pg.Pool`, `pg.Client`, and `pg.PoolClient`, as well as `PGlite`.
 */
export interface PgClient {
  query<T>(query: string, values?: unknown[]): Promise<{ rows: T[] }>

  // destroy methods (not consistent across libraries :c)
  close?(): MaybePromise<void> // pglite
  end?(): MaybePromise<void> // pg.Pool, pg.Client
  release?(): MaybePromise<void> // pg.PoolClient
}

type MigrationFunction = (client: PgClient) => Promise<void>

export interface PostgresStorageDriverOptions {
  /**
   * PostgreSQL schema to use for all tables.
   *
   * @default 'mtcute'
   */
  schema?: string

  /**
   * Whether to automatically close the client when the driver is destroyed.
   *
   * When passing a shared `pg.Pool`, you should leave this as `false`
   * (the default) to avoid terminating the pool for other consumers.
   *
   * @default false
   */
  autoClose?: boolean
}

export class PostgresStorageDriver extends BaseStorageDriver {
  readonly client: PgClient
  readonly schema: string

  private _cleanup?: () => void
  private _migrations: Map<string, Map<number, MigrationFunction>> = new Map()
  private _maxVersion: Map<string, number> = new Map()
  private _onLoadCallbacks = new Set<() => void>()
  private _autoClose = false

  constructor(
    client: PgClient,
    options?: PostgresStorageDriverOptions,
  ) {
    super()
    this.client = client
    this.schema = options?.schema ?? 'mtcute'
    this._autoClose = options?.autoClose ?? false
  }

  /** Returns a schema-qualified table name, safe for interpolation into SQL */
  tableName(name: string): string {
    return `"${this.schema}"."${name}"`
  }

  override setup(log: Logger, platform: ICorePlatform): void {
    super.setup(log, platform)
    this._log = log.create('postgres')
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

  onLoad(cb: () => void): void {
    if (this.loaded) {
      cb()
    } else {
      this._onLoadCallbacks.add(cb)
    }
  }

  private async _runMigrations(): Promise<void> {
    const migrationsTable = this.tableName('migrations')

    await this.client.query(`create schema if not exists "${this.schema}"`)
    await this.client.query(`
      create table if not exists ${migrationsTable} (
          repo text not null primary key,
          version integer not null
      )
    `)

    for (const repo of this._migrations.keys()) {
      const res = await this.client.query<{ version: number }>(
        `select version from ${migrationsTable} where repo = $1`,
        [repo],
      )

      const startVersion = res.rows[0]?.version ?? 0
      let fromVersion = startVersion

      const migrations = this._migrations.get(repo)!
      const targetVer = this._maxVersion.get(repo)!

      while (fromVersion < targetVer) {
        const nextVersion = fromVersion + 1
        const migration = migrations.get(nextVersion)

        if (!migration) {
          throw new Error(`No migration for ${repo} to version ${nextVersion}`)
        }

        await migration(this.client)

        fromVersion = nextVersion
      }

      if (fromVersion !== startVersion) {
        await this.client.query(
          `insert into ${migrationsTable} (repo, version) values ($1, $2)
           on conflict (repo) do update set version = $2`,
          [repo, targetVer],
        )
      }
    }
  }

  async _load(): Promise<void> {
    await this._runMigrations()

    this._cleanup = this._platform.beforeExit(() => {
      void this._destroy()
    })

    for (const cb of this._onLoadCallbacks) cb()
  }

  _save(): void {
    // PostgreSQL writes are applied immediately, no batching needed
  }

  async _destroy(): Promise<void> {
    this._cleanup?.()
    this._cleanup = undefined

    if (this._autoClose) {
      const fn = this.client.end ?? this.client.release ?? this.client.close
      if (fn) await fn.call(this.client)
    }
  }
}
