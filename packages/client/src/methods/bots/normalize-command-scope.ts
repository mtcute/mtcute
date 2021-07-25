import { tl } from '@mtqt/tl'
import { BotCommands, MtqtInvalidPeerTypeError } from '../../types'
import { TelegramClient } from '../../client'
import { normalizeToInputUser } from '../../utils/peer-utils'

/** @internal */
export async function _normalizeCommandScope(
    this: TelegramClient,
    scope: tl.TypeBotCommandScope | BotCommands.IntermediateScope
): Promise<tl.TypeBotCommandScope> {
    if (tl.isAnyBotCommandScope(scope)) return scope

    switch (scope.type) {
        case 'peer':
        case 'peer_admins': {
            const peer = await this.resolvePeer(scope.peer)

            return {
                _: scope.type === 'peer' ? 'botCommandScopePeer' : 'botCommandScopePeerAdmins',
                peer
            }
        }
        case 'member': {
            const chat = await this.resolvePeer(scope.chat)
            const user = normalizeToInputUser(await this.resolvePeer(scope.user))

            if (!user)
                throw new MtqtInvalidPeerTypeError(scope.user, 'user')

            return {
                _: 'botCommandScopePeerUser',
                peer: chat,
                userId: user
            }
        }
    }
}
