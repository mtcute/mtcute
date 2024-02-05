import { tl } from '@mtcute/tl'

import { assertNever } from '../../../types/utils.js'
import { ITelegramClient } from '../../client.types.js'
import { BotCommands } from '../../types/index.js'
import { resolvePeer, resolveUser } from '../users/resolve-peer.js'

/** @internal */
export async function _normalizeCommandScope(
    client: ITelegramClient,
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
            const user = await resolveUser(client, scope.user)
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
