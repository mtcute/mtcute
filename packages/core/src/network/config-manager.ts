import type { tl } from '../tl/index.js'
import { AsyncResource } from '@fuman/utils'

export interface FindDcOptionParams {
  dcId: number
  allowIpv6?: boolean
  preferIpv6?: boolean
  allowMedia?: boolean
  preferMedia?: boolean
  cdn?: boolean
}

/**
 * Config manager is responsible for keeping
 * the current server configuration up-to-date
 * and providing methods to find the best DC
 * option for the current session.
 */
export class ConfigManager extends AsyncResource<tl.RawConfig> {
  constructor(update: () => Promise<tl.RawConfig>) {
    super({
      fetcher: async () => {
        const res = await update()

        return {
          data: res,
          expiresIn: res.expires * 1000 - Date.now(),
        }
      },
      autoReload: true,
    })
  }

  /**
   * Find all DC options matching the given params,
   * ordered from the most preferred to the least preferred
   */
  async findOptions(params: FindDcOptionParams): Promise<tl.RawDcOption[]> {
    if (this.isStale) await this.update()

    const data = this.getCached()!

    const options = data.dcOptions.filter((opt) => {
      if (opt.tcpoOnly) return false // unsupported
      if (opt.ipv6 && !params.allowIpv6) return false
      if (opt.mediaOnly && !params.allowMedia) return false
      if (opt.cdn && !params.cdn) return false

      return opt.id === params.dcId
    })

    const rank = (opt: tl.RawDcOption): number => {
      if (params.preferMedia && params.preferIpv6 && opt.mediaOnly && opt.ipv6) return 0
      if (params.preferMedia && opt.mediaOnly) return 1
      if (params.preferIpv6 && opt.ipv6) return 2

      return 3
    }

    // Array#sort is stable, so the original order is kept within the same rank
    return options.sort((a, b) => rank(a) - rank(b))
  }

  async findOption(params: FindDcOptionParams): Promise<tl.RawDcOption | undefined> {
    const options = await this.findOptions(params)

    return options[0]
  }
}
