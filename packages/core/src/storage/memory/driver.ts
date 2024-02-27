import { IStorageDriver } from '../driver.js'

export class MemoryStorageDriver implements IStorageDriver {
    readonly states: Map<string, object> = new Map()

    getState<T extends object>(repo: string, def: () => T) {
        if (!this.states.has(repo)) {
            this.states.set(repo, def())
        }

        return this.states.get(repo) as T
    }

    load() {}
}
