import { IPeersRepository } from '../../../highlevel/storage/repository/peers.js'
import { MtcuteError } from '../../../types/errors.js'
import { BaseSqliteStorageDriver } from '../driver.js'
import { ISqliteStatement } from '../types.js'

interface PeerDto {
    id: number
    hash: string
    usernames: string
    updated: number
    phone: string | null
    complete: Uint8Array
}

function mapPeerDto(dto: PeerDto): IPeersRepository.PeerInfo {
    return {
        id: dto.id,
        accessHash: dto.hash,
        usernames: JSON.parse(dto.usernames) as string[],
        updated: dto.updated,
        phone: dto.phone || undefined,
        complete: dto.complete,
    }
}

export class SqlitePeersRepository implements IPeersRepository {
    private _loaded = false

    constructor(readonly _driver: BaseSqliteStorageDriver) {
        _driver.registerMigration('peers', 1, (db) => {
            db.exec(`
                create table peers (
                    id integer primary key,
                    hash text not null,
                    usernames json not null,
                    updated integer not null,
                    phone text,
                    complete blob
                );
                create index idx_peers_usernames on peers (usernames);
                create index idx_peers_phone on peers (phone);
            `)
        })
        _driver.onLoad((db) => {
            this._loaded = true

            this._store = db.prepare(
                'insert or replace into peers (id, hash, usernames, updated, phone, complete) values (?, ?, ?, ?, ?, ?)',
            )

            this._getById = db.prepare('select * from peers where id = ?')
            this._getByUsername = db.prepare(
                'select * from peers where exists (select 1 from json_each(usernames) where value = ?)',
            )
            this._getByPhone = db.prepare('select * from peers where phone = ?')

            this._delAll = db.prepare('delete from peers')
        })
        _driver.registerLegacyMigration('peers', (db) => {
            // not too important information, just drop the table
            db.exec('drop table entities')
        })
    }

    private _ensureLoaded() {
        // this is (so far) the only repo where we do such check because it's a common mistake to forget to call start()
        // or connect() on the client and immediately start using high-level methods, which in turn try to resolve peers
        // from the database, and fail because nothing is initialized yet

        if (!this._loaded) {
            throw new MtcuteError('Peers repository is not loaded. Have you called client.start() (or similar)?')
        }
    }

    private _store!: ISqliteStatement
    store(peer: IPeersRepository.PeerInfo): void {
        this._driver._writeLater(this._store, [
            peer.id,
            peer.accessHash,
            JSON.stringify(peer.usernames),
            peer.updated,
            peer.phone ?? null,
            peer.complete,
        ])
    }

    private _getById!: ISqliteStatement
    getById(id: number): IPeersRepository.PeerInfo | null {
        this._ensureLoaded()
        const row = this._getById.get(id)
        if (!row) return null

        return mapPeerDto(row as PeerDto)
    }

    private _getByUsername!: ISqliteStatement
    getByUsername(username: string): IPeersRepository.PeerInfo | null {
        this._ensureLoaded()
        const row = this._getByUsername.get(username)
        if (!row) return null

        return mapPeerDto(row as PeerDto)
    }

    private _getByPhone!: ISqliteStatement
    getByPhone(phone: string): IPeersRepository.PeerInfo | null {
        this._ensureLoaded()
        const row = this._getByPhone.get(phone)
        if (!row) return null

        return mapPeerDto(row as PeerDto)
    }

    private _delAll!: ISqliteStatement
    deleteAll(): void {
        this._delAll.run()
    }
}
