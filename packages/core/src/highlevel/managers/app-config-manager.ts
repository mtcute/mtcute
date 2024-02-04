import { tl } from '@mtcute/tl'

import { MtTypeAssertionError } from '../../types/errors.js'
import { Reloadable } from '../../utils/reloadable.js'
import { tlJsonToJson } from '../../utils/tl-json.js'
import { BaseTelegramClient } from '../base.js'
import { AppConfigSchema } from '../types/misc/app-config.js'

export class AppConfigManager {
    constructor(private client: BaseTelegramClient) {}

    private _reloadable = new Reloadable<tl.help.RawAppConfig>({
        reload: this._reload.bind(this),
        getExpiresAt: () => 3_600_000,
        disableAutoReload: true,
    })

    private async _reload(old?: tl.help.RawAppConfig) {
        const res = await this.client.call({
            _: 'help.getAppConfig',
            hash: old?.hash ?? 0,
        })

        if (res._ === 'help.appConfigNotModified') return old!

        return res
    }

    private _object?: AppConfigSchema
    async get(): Promise<AppConfigSchema> {
        if (!this._reloadable.isStale && this._object) return this._object

        const obj = tlJsonToJson((await this._reloadable.get()).config)

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
