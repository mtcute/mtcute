import { IKeyValueRepository } from '../../../storage/repository/key-value.js'
import { BaseService, ServiceOptions } from '../../../storage/service/base.js'
import { dataViewFromBuffer } from '../../../utils/buffer-utils.js'

const KV_PTS = 'updates_pts'
const KV_QTS = 'updates_qts'
const KV_DATE = 'updates_date'
const KV_SEQ = 'updates_seq'
const KV_CHANNEL_PREFIX = 'updates_channel:'

// todo: move inside updates manager?

export class UpdatesStateService extends BaseService {
    constructor(
        readonly _kv: IKeyValueRepository,
        opts: ServiceOptions,
    ) {
        super(opts)
    }

    private async _getInt(key: string): Promise<number | null> {
        const val = await this._kv.get(key)
        if (!val) return null

        return dataViewFromBuffer(val).getInt32(0, true)
    }

    private async _setInt(key: string, val: number): Promise<void> {
        const buf = new Uint8Array(4)
        dataViewFromBuffer(buf).setInt32(0, val, true)

        await this._kv.set(key, buf)
    }

    async getState(): Promise<[number, number, number, number] | null> {
        const [pts, qts, date, seq] = await Promise.all([
            this._getInt(KV_PTS),
            this._getInt(KV_QTS),
            this._getInt(KV_DATE),
            this._getInt(KV_SEQ),
        ])

        if (pts === null || qts === null || date === null || seq === null) {
            return null
        }

        return [pts, qts, date, seq]
    }

    async setPts(pts: number): Promise<void> {
        await this._setInt(KV_PTS, pts)
    }

    async setQts(qts: number): Promise<void> {
        await this._setInt(KV_QTS, qts)
    }

    async setDate(date: number): Promise<void> {
        await this._setInt(KV_DATE, date)
    }

    async setSeq(seq: number): Promise<void> {
        await this._setInt(KV_SEQ, seq)
    }

    async getChannelPts(channelId: number): Promise<number | null> {
        const val = await this._kv.get(KV_CHANNEL_PREFIX + channelId)
        if (!val) return null

        return dataViewFromBuffer(val).getUint32(0, true)
    }

    async setChannelPts(channelId: number, pts: number): Promise<void> {
        const buf = new Uint8Array(4)
        dataViewFromBuffer(buf).setUint32(0, pts, true)

        await this._kv.set(KV_CHANNEL_PREFIX + channelId, buf)
    }

    async setManyChannelPts(cpts: Map<number, number>): Promise<void> {
        const promises: Promise<void>[] = []

        for (const [channelId, pts] of cpts.entries()) {
            promises.push(this.setChannelPts(channelId, pts))
        }

        await Promise.all(promises)
    }
}
