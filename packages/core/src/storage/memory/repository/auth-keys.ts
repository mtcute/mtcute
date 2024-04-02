import { IAuthKeysRepository } from '../../repository/auth-keys.js'
import { MemoryStorageDriver } from '../driver.js'

interface AuthKeysState {
    authKeys: Map<number, Uint8Array>
    authKeysTemp: Map<string, Uint8Array>
    authKeysTempExpiry: Map<string, number>
}

export class MemoryAuthKeysRepository implements IAuthKeysRepository {
    readonly state
    constructor(readonly _driver: MemoryStorageDriver) {
        this.state = this._driver.getState<AuthKeysState>('authKeys', () => ({
            authKeys: new Map(),
            authKeysTemp: new Map(),
            authKeysTempExpiry: new Map(),
        }))
    }

    set(dc: number, key: Uint8Array | null): void {
        if (key) {
            this.state.authKeys.set(dc, key)
        } else {
            this.state.authKeys.delete(dc)
        }
    }

    get(dc: number): Uint8Array | null {
        return this.state.authKeys.get(dc) ?? null
    }

    setTemp(dc: number, idx: number, key: Uint8Array | null, expires: number): void {
        const k = `${dc}:${idx}`

        if (key) {
            this.state.authKeysTemp.set(k, key)
            this.state.authKeysTempExpiry.set(k, expires)
        } else {
            this.state.authKeysTemp.delete(k)
            this.state.authKeysTempExpiry.delete(k)
        }
    }

    getTemp(dc: number, idx: number, now: number): Uint8Array | null {
        const k = `${dc}:${idx}`

        if (now > (this.state.authKeysTempExpiry.get(k) ?? 0)) {
            return null
        }

        return this.state.authKeysTemp.get(k) ?? null
    }

    deleteByDc(dc: number): void {
        this.state.authKeys.delete(dc)

        for (const key of this.state.authKeysTemp.keys()) {
            if (key.startsWith(`${dc}:`)) {
                this.state.authKeysTemp.delete(key)
                this.state.authKeysTempExpiry.delete(key)
            }
        }
    }

    deleteAll(): void {
        this.state.authKeys.clear()
        this.state.authKeysTemp.clear()
        this.state.authKeysTempExpiry.clear()
    }
}
