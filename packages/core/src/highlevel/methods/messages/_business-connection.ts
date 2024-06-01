import { tl } from '@mtcute/tl'

import { RpcCallOptions } from '../../../network/network-manager.js'
import { MustEqual } from '../../../types/utils.js'
import { LruMap } from '../../../utils/lru-map.js'
import { ITelegramClient } from '../../client.types.js'
import { getBusinessConnection } from '../premium/get-business-connection.js'

// temporary solution
// todo – rework once we have either a more generic caching solution
const DC_MAP_SYMBOL = Symbol('dcMap')

const getDcMap = (client: ITelegramClient): LruMap<string, number> => {
    const client_ = client as typeof client & { [DC_MAP_SYMBOL]?: LruMap<string, number> }

    if (!client_[DC_MAP_SYMBOL]) {
        client_[DC_MAP_SYMBOL] = new LruMap(50)
    }

    return client_[DC_MAP_SYMBOL]
}

// @available=both
/**
 * @internal
 */
export async function _maybeInvokeWithBusinessConnection<T extends tl.RpcMethod>(
    client: ITelegramClient,
    businessConnectionId: string | undefined,
    request: MustEqual<T, tl.RpcMethod>,
    params?: RpcCallOptions,
): Promise<tl.RpcCallReturn[T['_']]> {
    if (!businessConnectionId) {
        return client.call(request, params)
    }

    const dcMap = getDcMap(client)

    if (!dcMap.has(businessConnectionId)) {
        const res = await getBusinessConnection(client, businessConnectionId)

        dcMap.set(businessConnectionId, res.dcId)
    }

    const dcId = dcMap.get(businessConnectionId)!

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return client.call(
        {
            _: 'invokeWithBusinessConnection',
            connectionId: businessConnectionId,
            query: request,
        },
        {
            ...params,
            localMigrate: true, // just in case
            dcId,
        },
    )
}
