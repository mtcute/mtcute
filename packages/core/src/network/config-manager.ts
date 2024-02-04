import { tl } from '@mtcute/tl'

import { Reloadable } from '../utils/reloadable.js'

/**
 * Config manager is responsible for keeping
 * the current server configuration up-to-date
 * and providing methods to find the best DC
 * option for the current session.
 */
export class ConfigManager extends Reloadable<tl.RawConfig> {
    constructor(update: () => Promise<tl.RawConfig>) {
        super({
            reload: update,
            getExpiresAt: (data) => data.expires * 1000,
        })
    }

    async findOption(params: {
        dcId: number
        allowIpv6?: boolean
        preferIpv6?: boolean
        allowMedia?: boolean
        preferMedia?: boolean
        cdn?: boolean
    }): Promise<tl.RawDcOption | undefined> {
        if (this.isStale) await this.update()

        const options = this._data!.dcOptions.filter((opt) => {
            if (opt.tcpoOnly) return false // unsupported
            if (opt.ipv6 && !params.allowIpv6) return false
            if (opt.mediaOnly && !params.allowMedia) return false
            if (opt.cdn && !params.cdn) return false

            return opt.id === params.dcId
        })

        if (params.preferMedia && params.preferIpv6) {
            const r = options.find((opt) => opt.mediaOnly && opt.ipv6)
            if (r) return r
        }

        if (params.preferMedia) {
            const r = options.find((opt) => opt.mediaOnly)
            if (r) return r
        }

        if (params.preferIpv6) {
            const r = options.find((opt) => opt.ipv6)
            if (r) return r
        }

        return options[0]
    }
}
