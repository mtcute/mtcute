import { MaybePromise, MemoryStorageDriver } from '@mtcute/core'

import { IStateStorageProvider } from '../provider.js'
import { IStateRepository } from '../repository.js'

interface StateDto {
    value: string
    expiresAt?: number
}

interface RateLimitDto {
    reset: number
    remaining: number
}

class MemoryStateRepository implements IStateRepository {
    readonly state
    readonly rl
    constructor(readonly _driver: MemoryStorageDriver) {
        this.state = this._driver.getState<Map<string, StateDto>>('dispatcher_fsm', () => new Map())
        this.rl = this._driver.getState<Map<string, RateLimitDto>>('rl', () => new Map())
    }

    setState(key: string, state: string, ttl?: number | undefined): void {
        this.state.set(key, {
            value: state,
            expiresAt: ttl ? Date.now() + ttl * 1000 : undefined,
        })
    }

    getState(key: string, now: number): string | null {
        const state = this.state.get(key)
        if (!state) return null

        if (state.expiresAt && state.expiresAt < now) {
            this.state.delete(key)

            return null
        }

        return state.value
    }

    deleteState(key: string): void {
        this.state.delete(key)
    }

    vacuum(now: number): void {
        for (const [key, state] of this.state.entries()) {
            if (state.expiresAt && state.expiresAt < now) {
                this.state.delete(key)
            }
        }

        for (const [key, state] of this.rl.entries()) {
            if (state.reset < now) {
                this.rl.delete(key)
            }
        }
    }

    getRateLimit(key: string, now: number, limit: number, window: number): [number, number] {
        // leaky bucket
        const item = this.rl.get(key)

        if (!item) {
            const state: RateLimitDto = {
                reset: now + window * 1000,
                remaining: limit,
            }

            this.rl.set(key, state)

            return [state.remaining, state.reset]
        }

        if (item.reset < now) {
            // expired

            const state: RateLimitDto = {
                reset: now + window * 1000,
                remaining: limit,
            }

            this.rl.set(key, state)

            return [state.remaining, state.reset]
        }

        item.remaining = item.remaining > 0 ? item.remaining - 1 : 0

        return [item.remaining, item.reset]
    }

    resetRateLimit(key: string): MaybePromise<void> {
        this.rl.delete(key)
    }
}

export class MemoryStateStorage implements IStateStorageProvider {
    readonly state

    constructor(readonly driver: MemoryStorageDriver = new MemoryStorageDriver()) {
        this.state = new MemoryStateRepository(this.driver)
    }
}
