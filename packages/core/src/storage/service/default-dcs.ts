import { DcOptions, parseBasicDcOption, serializeBasicDcOption } from '../../utils/dcs.js'
import { IKeyValueRepository } from '../repository/key-value.js'
import { BaseService, ServiceOptions } from './base.js'

const KV_MAIN = 'dc_main'
const KV_MEDIA = 'dc_media'

export class DefaultDcsService extends BaseService {
    constructor(
        readonly _kv: IKeyValueRepository,
        opts: ServiceOptions,
    ) {
        super(opts)
    }

    private _cached?: DcOptions

    async store(dcs: DcOptions): Promise<void> {
        if (this._cached) {
            if (
                this._cached.main === dcs.main &&
                this._cached.media === dcs.media
            ) return
        }

        this._cached = dcs

        const { main, media } = dcs
        const mainData = serializeBasicDcOption(main)
        await this._kv.set(KV_MAIN, mainData)

        if (media !== main) {
            const mediaData = serializeBasicDcOption(media)
            await this._kv.set(KV_MEDIA, mediaData)
        } else {
            await this._kv.delete(KV_MEDIA)
        }
    }

    async fetch(): Promise<DcOptions | null> {
        if (this._cached) return this._cached

        const [mainData, mediaData] = await Promise.all([
            this._kv.get(KV_MAIN),
            this._kv.get(KV_MEDIA),
        ])

        if (!mainData) return null

        const main = parseBasicDcOption(mainData)
        if (!main) return null

        const dcs: DcOptions = { main, media: main }

        if (mediaData) {
            const media = parseBasicDcOption(mediaData)

            if (media) {
                dcs.media = media
            }
        }

        this._cached = dcs

        return dcs
    }
}
