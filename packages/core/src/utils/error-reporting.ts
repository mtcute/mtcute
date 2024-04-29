import { tl } from '@mtcute/tl'

import { Logger } from './logger.js'

export function reportUnknownError(log: Logger, error: tl.RpcError, method: string): void {
    if (typeof fetch !== 'function') return

    fetch(`https://rpc.pwrtelegram.xyz/?code=${error.code}&method=${method}&error=${error.text}`)
        .then((r) => r.json())
        .then((r) => {
            if (r.ok) {
                log.info('telerpc responded with error info for %s: %s', error.text, r.result)
            } else {
                log.info(
                    'Reported error %s to telerpc. You can disable this using `enableErrorReporting: false`',
                    error.text,
                )
            }
        })
        .catch((e) => {
            log.debug('failed to report error %s to telerpc: %s', error.text, e)
        })
}
