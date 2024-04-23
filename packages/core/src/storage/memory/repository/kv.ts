import { IKeyValueRepository } from '../../repository/key-value.js'
import { MemoryStorageDriver } from '../driver.js'

export class MemoryKeyValueRepository implements IKeyValueRepository {
    readonly state
    constructor(readonly _driver: MemoryStorageDriver) {
        this.state = this._driver.getState<Map<string, Uint8Array>>('kv', () => new Map())
    }

    set(key: string, value: Uint8Array): void {
        this.state.set(key, value)
    }

    get(key: string): Uint8Array | null {
        return this.state.get(key) ?? null
    }

    delete(key: string): void {
        this.state.delete(key)
    }

    deleteAll(): void {
        this.state.clear()
    }
}
