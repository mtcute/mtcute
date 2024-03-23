import { __tlReaderMap } from '@mtcute/tl/binary/reader.js'
import { __tlWriterMap } from '@mtcute/tl/binary/writer.js'

import { CurrentUserService } from '../../../highlevel/storage/service/current-user.js'
import { UpdatesStateService } from '../../../highlevel/storage/service/updates.js'
import { IKeyValueRepository } from '../../repository/key-value.js'
import { ServiceOptions } from '../../service/base.js'
import { DefaultDcsService } from '../../service/default-dcs.js'
import { BaseSqliteStorageDriver } from '../driver.js'
import { ISqliteStatement } from '../types.js'

interface KeyValueDto {
    key: string
    value: Uint8Array
}

export class SqliteKeyValueRepository implements IKeyValueRepository {
    constructor(readonly _driver: BaseSqliteStorageDriver) {
        _driver.registerMigration('kv', 1, (db) => {
            db.exec(`
                create table key_value (
                    key text primary key,
                    value blob not null
                );
            `)
        })
        _driver.onLoad((db) => {
            this._get = db.prepare('select value from key_value where key = ?')
            this._set = db.prepare('insert or replace into key_value (key, value) values (?, ?)')
            this._del = db.prepare('delete from key_value where key = ?')
            this._delAll = db.prepare('delete from key_value')
        })

        // awkward dependencies, unsafe code, awful crutches
        // all in the name of backwards compatibility
        /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
        /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-floating-promises */
        /* eslint-disable @typescript-eslint/no-unsafe-argument */
        _driver.registerLegacyMigration('kv', (db) => {
            // fetch all values from the old table
            const all = db.prepare('select key, value from kv').all() as { key: string; value: string }[]
            const obj: Record<string, any> = {}

            for (const { key, value } of all) {
                obj[key] = JSON.parse(value)
            }

            db.exec('drop table kv')

            // lol
            const options: ServiceOptions = {
                driver: this._driver,
                readerMap: __tlReaderMap,
                writerMap: __tlWriterMap,
                // eslint-disable-next-line dot-notation
                log: this._driver['_log'],
            }

            if (obj.self) {
                new CurrentUserService(this, options).store({
                    userId: obj.self.userId,
                    isBot: obj.self.isBot,
                    isPremium: false,
                    usernames: [],
                })
            }

            if (obj.pts) {
                const svc = new UpdatesStateService(this, options)
                svc.setPts(obj.pts)
                if (obj.qts) svc.setQts(obj.qts)
                if (obj.date) svc.setDate(obj.date)
                if (obj.seq) svc.setSeq(obj.seq)

                // also fetch channel states. they were moved to kv from a separate table
                const channels = db.prepare('select * from pts').all() as any[]

                for (const channel of channels) {
                    svc.setChannelPts(channel.channel_id, channel.pts)
                }
            }
            db.exec('drop table pts')

            if (obj.def_dc) {
                new DefaultDcsService(this, options).store(obj.def_dc)
            }
        })
        /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
        /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-floating-promises */
        /* eslint-enable @typescript-eslint/no-unsafe-argument */
    }

    private _set!: ISqliteStatement
    set(key: string, value: Uint8Array): void {
        this._driver._writeLater(this._set, [key, value])
    }

    private _get!: ISqliteStatement
    get(key: string): Uint8Array | null {
        const res = this._get.get(key)
        if (!res) return null

        return (res as KeyValueDto).value
    }

    private _del!: ISqliteStatement
    delete(key: string): void {
        this._del.run(key)
    }

    private _delAll!: ISqliteStatement
    deleteAll(): void {
        this._delAll.run()
    }
}
