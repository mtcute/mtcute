import { assertNever } from '@mtcute/core'
import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { BotCommands } from '../../types'
import { normalizeToInputUser } from '../../utils/peer-utils'

/** @internal */
export async function _normalizeCommandScope(
    this: TelegramClient,
    scope: tl.TypeBotCommandScope | BotCommands.IntermediateScope,
): Promise<tl.TypeBotCommandScope> {
    if (tl.isAnyBotCommandScope(scope)) return scope

    switch (scope.type) {
        case 'peer':
        case 'peer_admins': {
            const peer = await this.resolvePeer(scope.peer)

            return {
                _: scope.type === 'peer' ? 'botCommandScopePeer' : 'botCommandScopePeerAdmins',
                peer,
            }
        }
        case 'member': {
            const user = normalizeToInputUser(await this.resolvePeer(scope.user), scope.user)
            const chat = await this.resolvePeer(scope.chat)

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
