import type { tl } from '@mtcute/tl'
import { AsyncResource, asNonNull } from '@fuman/utils'

import { MtTypeAssertionError } from '../../types/errors.js'
import { tlJsonToJson } from '../../utils/tl-json.js'
import type { BaseTelegramClient } from '../base.js'
import type { AppConfigSchema } from '../types/misc/app-config.js'

export class AppConfigManager {
    private _resource
    constructor(private client: BaseTelegramClient) {
        this._resource = new AsyncResource<tl.help.RawAppConfig>({
            fetcher: async ({ current }) => {
                const res = await this.client.call({
                    _: 'help.getAppConfig',
                    hash: current?.hash ?? 0,
                })

                if (res._ === 'help.appConfigNotModified') {
                    return {
                        data: asNonNull(current),
                        expiresIn: 3_600_000,
                    }
                }

                return {
                    data: res,
                    expiresIn: 3_600_000,
                }
            },
        })
    }

    private _object?: AppConfigSchema
    async get(): Promise<AppConfigSchema> {
        if (!this._resource.isStale && this._object) return this._object

        const obj = tlJsonToJson((await this._resource.get()).config)

        if (!obj || typeof obj !== 'object') {
            throw new MtTypeAssertionError('appConfig', 'object', typeof obj)
        }

        this._object = obj as AppConfigSchema

        return this._object
    }

    async getField<K extends keyof AppConfigSchema>(field: K): Promise<AppConfigSchema[K]>
    async getField<K extends keyof AppConfigSchema>(
        field: K,
        fallback: NonNullable<AppConfigSchema[K]>,
    ): Promise<NonNullable<AppConfigSchema[K]>>
    async getField<K extends keyof AppConfigSchema>(
        field: K,
        fallback?: NonNullable<AppConfigSchema[K]>,
    ): Promise<AppConfigSchema[K]> {
        const obj = await this.get()

        return obj[field] ?? fallback
    }
}
