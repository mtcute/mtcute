import { tl } from '@mtcute/core'

import { InputPeerLike } from '../peers/index.js'

/**
 * Helper constants and builder functions for methods
 * related to bot commands.
 *
 * You can learn more about bot command scopes in
 * [Bot API docs](https://core.telegram.org/bots/api#botcommandscope)
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace BotCommands {
    /**
     * Intermediate bot scope, that is converted to
     * TL type `BotCommandScope` by the respective functions.
     *
     * Used to avoid manually resolving peers.
     */
    export type IntermediateScope =
        | {
              type: 'peer' | 'peer_admins'
              peer: InputPeerLike
          }
        | {
              type: 'member'
              chat: InputPeerLike
              user: InputPeerLike
          }

    /**
     * Default commands scope.
     *
     * Used if no commands with a narrower scope are available.
     */
    export const default_: tl.RawBotCommandScopeDefault = {
        _: 'botCommandScopeDefault',
    } as const

    /**
     * Scope that covers all private chats
     */
    export const allPrivate: tl.RawBotCommandScopeUsers = {
        _: 'botCommandScopeUsers',
    } as const

    /**
     * Scope that covers all group chats (both legacy and supergroups)
     */
    export const allGroups: tl.RawBotCommandScopeChats = {
        _: 'botCommandScopeChats',
    } as const

    /**
     * Scope that covers all group chat administrators (both legacy and supergroups)
     */
    export const allGroupAdmins: tl.RawBotCommandScopeChatAdmins = {
        _: 'botCommandScopeChatAdmins',
    } as const

    /**
     * Scope that covers a specific peer (a single user in PMs,
     * or all users of a legacy group or a supergroup)
     */
    export function peer(peer: InputPeerLike): IntermediateScope {
        return {
            type: 'peer',
            peer,
        }
    }

    /**
     * Scope that covers admins in a specific group
     */
    export function groupAdmins(peer: InputPeerLike): IntermediateScope {
        return {
            type: 'peer_admins',
            peer,
        }
    }

    /**
     * Scope that covers a specific user in a specific group
     */
    export function groupMember(chat: InputPeerLike, user: InputPeerLike): IntermediateScope {
        return {
            type: 'member',
            chat,
            user,
        }
    }

    /**
     * Helper function to create a bot command object
     *
     * @param command  Bot command (without slash)
     * @param description  Command description
     */
    export function cmd(command: string, description: string): tl.RawBotCommand {
        return {
            _: 'botCommand',
            command,
            description,
        }
    }
}
