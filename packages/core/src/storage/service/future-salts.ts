import { mtp } from '@mtcute/tl'
import { TlBinaryReader, TlBinaryWriter } from '@mtcute/tl-runtime'

import { IKeyValueRepository } from '../repository/key-value.js'
import { BaseService, ServiceOptions } from './base.js'

const KV_PREFIX = 'salts:'

export class FutureSaltsService extends BaseService {
    constructor(
        readonly _kv: IKeyValueRepository,
        opts: ServiceOptions,
    ) {
        super(opts)
    }

    private _cached = new Map<number, mtp.RawMt_future_salt[]>()

    async store(dcId: number, salts: mtp.RawMt_future_salt[]): Promise<void> {
        if (this._cached.get(dcId) === salts) return

        const writer = TlBinaryWriter.alloc(this._writerMap, 8 + 20 * salts.length)
        writer.vector(writer.object, salts)

        await this._kv.set(KV_PREFIX + dcId, writer.result())
    }

    async fetch(dcId: number): Promise<mtp.RawMt_future_salt[] | null> {
        const cached = this._cached.get(dcId)
        if (cached) return cached

        const data = await this._kv.get(KV_PREFIX + dcId)
        if (!data) return null

        const reader = new TlBinaryReader(this._readerMap, data)
        const salts = reader.vector()

        for (const salt of salts) {
            if ((salt as { _: string })._ !== 'mt_future_salt') return null
        }

        const salts_ = salts as mtp.RawMt_future_salt[]
        this._cached.set(dcId, salts_)

        return salts_
    }

    async delete(dcId: number): Promise<void> {
        this._cached.delete(dcId)
        await this._kv.delete(KV_PREFIX + dcId)
    }
}
