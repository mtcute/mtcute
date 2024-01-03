import { Statement } from 'better-sqlite3'

import { IPeersRepository } from '@mtcute/core/src/storage/repository/peers.js'

import { SqliteStorageDriver } from '../driver.js'

interface PeerDto {
    id: number
    hash: string
    usernames: string
    updated: number
    phone: string | null
    // eslint-disable-next-line no-restricted-globals
    complete: Buffer
}

function mapPeerDto(dto: PeerDto): IPeersRepository.PeerInfo {
    return {
        id: dto.id,
        accessHash: dto.hash,
        usernames: JSON.parse(dto.usernames),
        updated: dto.updated,
        phone: dto.phone || undefined,
        complete: dto.complete,
    }
}

export class SqlitePeersRepository implements IPeersRepository {
    constructor(readonly _driver: SqliteStorageDriver) {
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
            this._store = db.prepare(
                'insert or replace into peers (id, hash, usernames, updated, phone, complete) values (?, ?, ?, ?, ?, ?)',
            )

            this._getById = db.prepare('select * from peers where id = ?')
            this._getByUsername = db.prepare('select * from peers where exists (select 1 from json_each(usernames) where value = ?)')
            this._getByPhone = db.prepare('select * from peers where phone = ?')

            this._delAll = db.prepare('delete from peers')
        })
    }

    private _store!: Statement
    store(peer: IPeersRepository.PeerInfo): void {
        this._driver._writeLater(this._store, [
            peer.id,
            peer.accessHash,
            // add commas to make it easier to search with LIKE
            JSON.stringify(peer.usernames),
            peer.updated,
            peer.phone,
            peer.complete,
        ])
    }

    private _getById!: Statement
    getById(id: number): IPeersRepository.PeerInfo | null {
        const row = this._getById.get(id)
        if (!row) return null

        return mapPeerDto(row as PeerDto)
    }

    private _getByUsername!: Statement
    getByUsername(username: string): IPeersRepository.PeerInfo | null {
        const row = this._getByUsername.get(username)
        if (!row) return null

        return mapPeerDto(row as PeerDto)
    }

    private _getByPhone!: Statement
    getByPhone(phone: string): IPeersRepository.PeerInfo | null {
        const row = this._getByPhone.get(phone)
        if (!row) return null

        return mapPeerDto(row as PeerDto)
    }

    private _delAll!: Statement
    deleteAll(): void {
        this._delAll.run()
    }
}
