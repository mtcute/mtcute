import type { tl } from '../../../tl/index.js'

import { makeInspectable } from '../../utils/inspectable.js'

/**
 * A statistical graph
 */
export class StatsGraph {
  constructor(readonly raw: tl.TypeStatsGraph) {}

  /**
   * Status of the graph:
   *  - `loaded`: graph data is available in {@link json}
   *  - `async`: graph data must be loaded asynchronously using {@link token}
   *  - `error`: graph could not be loaded, see {@link error}
   */
  get status(): 'loaded' | 'async' | 'error' {
    switch (this.raw._) {
      case 'statsGraph':
        return 'loaded'
      case 'statsGraphAsync':
        return 'async'
      case 'statsGraphError':
        return 'error'
    }
  }

  /** Graph data in JSON format, if {@link status} is `loaded` */
  get json(): string | null {
    return this.raw._ === 'statsGraph' ? this.raw.json.data : null
  }

  /** Token for loading a zoomed in graph, if available */
  get zoomToken(): string | null {
    return this.raw._ === 'statsGraph' ? this.raw.zoomToken ?? null : null
  }

  /** Token for loading the graph data, if {@link status} is `async` */
  get token(): string | null {
    return this.raw._ === 'statsGraphAsync' ? this.raw.token : null
  }

  /** Error message to be shown instead of the graph, if {@link status} is `error` */
  get error(): string | null {
    return this.raw._ === 'statsGraphError' ? this.raw.error : null
  }
}

makeInspectable(StatsGraph)
