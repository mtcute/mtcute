import { IPeersRepository } from '../../../highlevel/storage/repository/peers.js'
import { MemoryStorageDriver } from '../driver.js'

interface PeersState {
    entities: Map<number, IPeersRepository.PeerInfo>
    usernameIndex: Map<string, number>
    phoneIndex: Map<string, number>
}

export class MemoryPeersRepository implements IPeersRepository {
    readonly state
    constructor(readonly _driver: MemoryStorageDriver) {
        this.state = this._driver.getState<PeersState>('peers', () => ({
            entities: new Map(),
            usernameIndex: new Map(),
            phoneIndex: new Map(),
        }))
    }

    store(peer: IPeersRepository.PeerInfo): void {
        const old = this.state.entities.get(peer.id)

        if (old) {
            // delete old index entries if needed
            old.usernames.forEach((username) => {
                this.state.usernameIndex.delete(username)
            })

            if (old.phone) {
                this.state.phoneIndex.delete(old.phone)
            }
        }

        if (peer.usernames) {
            for (const username of peer.usernames) {
                this.state.usernameIndex.set(username, peer.id)
            }
        }

        if (peer.phone) this.state.phoneIndex.set(peer.phone, peer.id)

        this.state.entities.set(peer.id, peer)
    }

    getById(id: number): IPeersRepository.PeerInfo | null {
        return this.state.entities.get(id) ?? null
    }

    getByUsername(username: string): IPeersRepository.PeerInfo | null {
        const id = this.state.usernameIndex.get(username.toLowerCase())
        if (!id) return null

        return this.state.entities.get(id) ?? null
    }

    getByPhone(phone: string): IPeersRepository.PeerInfo | null {
        const id = this.state.phoneIndex.get(phone)
        if (!id) return null

        return this.state.entities.get(id) ?? null
    }

    deleteAll(): void {
        this.state.entities.clear()
        this.state.phoneIndex.clear()
        this.state.usernameIndex.clear()
    }
}
