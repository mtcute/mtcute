import { IReferenceMessagesRepository } from '../../../highlevel/storage/repository/ref-messages.js'
import { MemoryStorageDriver } from '../driver.js'

interface RefMessagesState {
    refs: Map<number, Set<string>>
}

export class MemoryRefMessagesRepository implements IReferenceMessagesRepository {
    readonly state
    constructor(readonly _driver: MemoryStorageDriver) {
        this.state = this._driver.getState<RefMessagesState>('refMessages', () => ({
            refs: new Map(),
        }))
    }

    store(peerId: number, chatId: number, msgId: number): void {
        if (!this.state.refs.has(peerId)) {
            this.state.refs.set(peerId, new Set())
        }

        this.state.refs.get(peerId)!.add(`${chatId}:${msgId}`)
    }

    getByPeer(peerId: number): [number, number] | null {
        const refs = this.state.refs.get(peerId)
        if (!refs?.size) return null
        const [ref] = refs

        const [chatId, msgId] = ref.split(':')

        return [Number(chatId), Number(msgId)]
    }

    delete(chatId: number, msgIds: number[]): void {
        // not the most efficient way, but it's fine
        for (const refs of this.state.refs.values()) {
            for (const msg of msgIds) {
                refs.delete(`${chatId}:${msg}`)
            }
        }
    }

    deleteByPeer(peerId: number): void {
        this.state.refs.delete(peerId)
    }

    deleteAll(): void {
        this.state.refs.clear()
    }
}
