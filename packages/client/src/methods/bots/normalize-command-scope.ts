import { assertNever, BaseTelegramClient, tl } from '@mtcute/core'

import { BotCommands } from '../../types'
import { normalizeToInputUser } from '../../utils/peer-utils'
import { resolvePeer } from '../users/resolve-peer'

/** @internal */
export async function _normalizeCommandScope(
    client: BaseTelegramClient,
    scope: tl.TypeBotCommandScope | BotCommands.IntermediateScope,
): Promise<tl.TypeBotCommandScope> {
    if (tl.isAnyBotCommandScope(scope)) return scope

    switch (scope.type) {
        case 'peer':
        case 'peer_admins': {
            const peer = await resolvePeer(client, scope.peer)

            return {
                _: scope.type === 'peer' ? 'botCommandScopePeer' : 'botCommandScopePeerAdmins',
                peer,
            }
        }
        case 'member': {
            const user = normalizeToInputUser(await resolvePeer(client, scope.user), scope.user)
            const chat = await resolvePeer(client, scope.chat)

            return {
                _: 'botCommandScopePeerUser',
                peer: chat,
                userId: user,
            }
        }
        default:
            assertNever(scope)
    }
}
