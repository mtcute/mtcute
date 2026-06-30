import type { ConnectionKind, RpcCallMiddleware } from '../network-manager.js'
import { combineAbortSignals } from '../../utils/abort-signal.js'
import { ResourceLimiter } from '../resource-limiter.js'

const DOWNLOAD_RESOURCE_LIMIT: number = 2 * 1024 * 1024
const DOWNLOAD_RESOURCE_LIMIT_PREMIUM: number = 16 * 1024 * 1024
const UPLOAD_RESOURCE_LIMIT: number = 4 * 1024 * 1024

export interface MediaThrottleOptions {
  getResourceLimit?: (kind: ConnectionKind, isPremium: boolean) => number
}

function defaultResourceLimit(kind: ConnectionKind, isPremium: boolean): number {
  if (kind === 'upload') return UPLOAD_RESOURCE_LIMIT
  return isPremium ? DOWNLOAD_RESOURCE_LIMIT_PREMIUM : DOWNLOAD_RESOURCE_LIMIT
}

export function mediaThrottle(params?: MediaThrottleOptions): RpcCallMiddleware {
  const { getResourceLimit = defaultResourceLimit } = params ?? {}
  const limiters = new Map<ConnectionKind, Map<number, ResourceLimiter>>()

  const getLimiter = (kind: ConnectionKind, dcId: number, isPremium: boolean): ResourceLimiter => {
    let byDc = limiters.get(kind)
    if (!byDc) {
      byDc = new Map()
      limiters.set(kind, byDc)
    }

    const max = getResourceLimit(kind, isPremium)
    let limiter = byDc.get(dcId)
    if (!limiter) {
      limiter = new ResourceLimiter(max)
      byDc.set(dcId, limiter)
    } else if (limiter.max !== max) {
      limiter.setMax(max)
    }

    return limiter
  }

  return async (ctx, next) => {
    let kind: ConnectionKind | undefined
    let bytes = 0

    switch (ctx.request._) {
      case 'upload.getFile':
      case 'upload.getWebFile':
        kind = ctx.params?.kind ?? 'download'
        bytes = ctx.request.limit
        break
      case 'upload.saveFilePart':
      case 'upload.saveBigFilePart':
        kind = 'upload'
        bytes = ctx.request.bytes.length
        break
    }

    if (kind === undefined) return next(ctx)

    const dcId = ctx.params?.dcId ?? ctx.manager.getPrimaryDcId()
    const limiter = getLimiter(kind, dcId, ctx.manager.params.isPremium)

    if (!limiter.tryAcquire(bytes)) {
      const abortSignal = combineAbortSignals(ctx.manager.params.stopSignal, ctx.params?.abortSignal)
      await limiter.acquire(bytes, abortSignal)
    }

    try {
      return await next(ctx)
    } finally {
      limiter.release(bytes)
    }
  }
}
