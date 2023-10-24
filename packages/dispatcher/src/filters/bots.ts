import { MaybeArray, MaybeAsync, Message } from '@mtcute/client'

import { MessageContext } from '../context/message.js'
import { chat } from './chat.js'
import { and, or } from './logic.js'
import { UpdateFilter } from './types.js'

/**
 * Filter messages that call the given command(s)..
 *
 * When a command matches, the match array is stored in a
 * type-safe extension field `.commmand` of the {@link Message} object.
 * First element is the command itself, then the arguments.
 *
 * If the matched command was a RegExp, the first element is the
 * command, then the groups from the command regex, then the arguments.
 *
 * @param commands  Command(s) the filter should look for (w/out prefix)
 * @param prefixes
 *   Prefix(es) the filter should look for (default: `/`).
 *   Can be `null` to disable prefixes altogether
 * @param caseSensitive
 */
export const command = (
    commands: MaybeArray<string | RegExp>,
    prefixes: MaybeArray<string> | null = '/',
    caseSensitive = false,
): UpdateFilter<MessageContext, { command: string[] }> => {
    if (!Array.isArray(commands)) commands = [commands]

    commands = commands.map((i) => (typeof i === 'string' ? i.toLowerCase() : i))

    const argumentsRe = /(["'])(.*?)(?<!\\)\1|(\S+)/g
    const unescapeRe = /\\(['"])/
    const commandsRe: RegExp[] = []
    commands.forEach((cmd) => {
        if (typeof cmd !== 'string') cmd = cmd.source

        commandsRe.push(new RegExp(`^(${cmd})(?:\\s|$|@([a-zA-Z0-9_]+?bot)(?:\\s|$))`, caseSensitive ? '' : 'i'))
    })

    if (prefixes === null) prefixes = []
    if (typeof prefixes === 'string') prefixes = [prefixes]

    const _prefixes = prefixes

    const check = (msg: MessageContext): MaybeAsync<boolean> => {
        if (msg.isMessageGroup) return check(msg.messages[0])

        for (const pref of _prefixes) {
            if (!msg.text.startsWith(pref)) continue

            const withoutPrefix = msg.text.slice(pref.length)

            for (const regex of commandsRe) {
                const m = withoutPrefix.match(regex)
                if (!m) continue

                const lastGroup = m[m.length - 1]

                if (lastGroup) {
                    const state = msg.client.getAuthState()

                    if (state.isBot && lastGroup !== state.selfUsername) {
                        return false
                    }
                }

                const match = m.slice(1, -1)

                // we use .replace to iterate over global regex, not to replace the text
                withoutPrefix.slice(m[0].length).replace(argumentsRe, ($0, $1, $2: string, $3: string) => {
                    match.push(($2 || $3 || '').replace(unescapeRe, '$1'))

                    return ''
                })
                ;(msg as MessageContext & { command: string[] }).command = match

                return true
            }
        }

        return false
    }

    return check
}

/**
 * Shorthand filter that matches /start commands sent to bot's
 * private messages.
 */
export const start = and(chat('private'), command('start'))

/**
 * Shorthand filter that matches /start commands
 * sent in groups (i.e. using `?startgroup` parameter).
 */
export const startGroup = and(or(chat('supergroup'), chat('group')), command('start'))

/**
 * Filter for deep links (i.e. `/start <deeplink_parameter>`).
 *
 * If the parameter is a regex, groups are added to `msg.command`,
 * meaning that the first group is available in `msg.command[2]`.
 */
export const deeplink = (params: MaybeArray<string | RegExp>): UpdateFilter<MessageContext, { command: string[] }> => {
    if (!Array.isArray(params)) {
        return and(start, (_msg: Message) => {
            const msg = _msg as Message & { command: string[] }

            if (msg.command.length !== 2) return false

            const p = msg.command[1]
            if (typeof params === 'string' && p === params) return true

            const m = p.match(params)
            if (!m) return false

            msg.command.push(...m.slice(1))

            return true
        })
    }

    return and(start, (_msg: Message) => {
        const msg = _msg as Message & { command: string[] }

        if (msg.command.length !== 2) return false

        const p = msg.command[1]

        for (const param of params) {
            if (typeof param === 'string' && p === param) return true

            const m = p.match(param)
            if (!m) continue

            msg.command.push(...m.slice(1))

            return true
        }

        return false
    })
}
