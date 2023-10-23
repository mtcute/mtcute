import { tl } from '@mtcute/tl'

import { isPresent } from '../type-assertions.js'
import { deeplinkBuilder } from './common.js'

/**
 * Bot deeplinks
 *
 * Used to link to bots with a start parameter
 */
export const botStart = deeplinkBuilder<{
    /** Bot username */
    username: string
    /** Start parameter */
    parameter: string
}>({
    internalBuild: ({ username, parameter }) => ['resolve', { domain: username, start: parameter }],
    internalParse: (path, query) => {
        if (path !== 'resolve') return null

        const username = query.get('domain')
        const parameter = query.get('start')

        if (!username || !parameter) return null

        return { username, parameter }
    },
    externalBuild: ({ username, parameter }) => [username, { start: parameter }],
    externalParse: (path, query) => {
        if (path.includes('/') || path[0] === '+' || path.length <= 2) return null

        const username = path
        const parameter = query.get('start')

        if (!parameter) return null

        return { username, parameter }
    },
})

type BotAdminRight = Exclude<keyof tl.RawChatAdminRights, '_'>

function normalizeBotAdmin(rights?: BotAdminRight[]): string | undefined {
    if (!rights?.length) return

    return rights
        .map((it) => {
            switch (it) {
                case 'changeInfo':
                    return 'change_info'
                case 'postMessages':
                    return 'post_messages'
                case 'editMessages':
                    return 'edit_messages'
                case 'deleteMessages':
                    return 'delete_messages'
                case 'banUsers':
                    return 'restrict_members'
                case 'inviteUsers':
                    return 'invite_users'
                case 'pinMessages':
                    return 'pin_messages'
                case 'manageTopics':
                    return 'manage_topics'
                case 'addAdmins':
                    return 'promote_members'
                case 'manageCall':
                    return 'manage_video_chats'
                case 'anonymous':
                    return 'anonymous'
                case 'other':
                    return 'manage_chat'
                case 'postStories':
                    return 'post_stories'
                case 'editStories':
                    return 'edit_stories'
                case 'deleteStories':
                    return 'delete_stories'
            }
        })
        .join('+')
}

function parseBotAdmin(rights: string | null): BotAdminRight[] | undefined {
    if (!rights) return

    return rights
        .split('+')
        .map((it) => {
            switch (it) {
                case 'change_info':
                    return 'changeInfo'
                case 'post_messages':
                    return 'postMessages'
                case 'edit_messages':
                    return 'editMessages'
                case 'delete_messages':
                    return 'deleteMessages'
                case 'restrict_members':
                    return 'banUsers'
                case 'invite_users':
                    return 'inviteUsers'
                case 'pin_messages':
                    return 'pinMessages'
                case 'manage_topics':
                    return 'manageTopics'
                case 'promote_members':
                    return 'addAdmins'
                case 'manage_video_chats':
                    return 'manageCall'
                case 'anonymous':
                    return 'anonymous'
                case 'manage_chat':
                    return 'other'
                case 'post_stories':
                    return 'postStories'
                case 'edit_stories':
                    return 'editStories'
                case 'delete_stories':
                    return 'deleteStories'
                default:
                    return null
            }
        })
        .filter(isPresent)
}

/**
 * Bot add to group links
 *
 * Used to ask the user to add a bot to a group, optionally asking for admin rights.
 * Note that the user is still free to choose which rights to grant, and
 * whether to grant them at all.
 */
export const botAddToGroup = deeplinkBuilder<{
    /** Bot username */
    bot: string
    /** If specified, the client will call `/start parameter` on the bot once the bot has been added */
    parameter?: string
    /** Admin rights to request */
    admin?: BotAdminRight[]
}>({
    internalBuild: ({ bot, parameter, admin }) => [
        'resolve',
        { domain: bot, startgroup: parameter ?? true, admin: normalizeBotAdmin(admin) },
    ],
    internalParse: (path, query) => {
        if (path !== 'resolve') return null

        const bot = query.get('domain')
        const parameter = query.get('startgroup')
        const admin = query.get('admin')

        if (!bot || parameter === null) return null

        return {
            bot,
            parameter: parameter === '' ? undefined : parameter,
            admin: parseBotAdmin(admin),
        }
    },

    externalBuild: ({ bot, parameter, admin }) => [
        bot,
        { startgroup: parameter ?? true, admin: normalizeBotAdmin(admin) },
    ],
    externalParse: (path, query) => {
        if (path.includes('/') || path[0] === '+' || path.length <= 2) return null

        const bot = path
        const parameter = query.get('startgroup')
        const admin = query.get('admin')

        if (parameter === null) return null

        return {
            bot,
            parameter: parameter === '' ? undefined : parameter,
            admin: parseBotAdmin(admin),
        }
    },
})

/**
 * Bot add to channel links
 *
 * Used to ask the user to add a bot to a channel, optionally with admin rights.
 * Note that the user is still free to choose which rights to grant, and
 * whether to grant them at all.
 */
export const botAddToChannel = deeplinkBuilder<{
    /** Bot username */
    bot: string
    /** Admin rights to request */
    admin?: BotAdminRight[]
}>({
    internalBuild: ({ bot, admin }) => [
        'resolve',
        { domain: bot, startchannel: true, admin: normalizeBotAdmin(admin) },
    ],
    internalParse: (path, query) => {
        if (path !== 'resolve') return null

        const bot = query.get('domain')
        const parameter = query.get('startchannel')
        const admin = query.get('admin')

        if (!bot || parameter === null) return null

        return {
            bot,
            admin: parseBotAdmin(admin),
        }
    },

    externalBuild: ({ bot, admin }) => [bot, { startchannel: true, admin: normalizeBotAdmin(admin) }],
    externalParse: (path, query) => {
        if (path.includes('/') || path[0] === '+' || path.length <= 2) return null

        const bot = path
        const parameter = query.get('startchannel')
        const admin = query.get('admin')

        if (parameter === null) return null

        return {
            bot,
            admin: parseBotAdmin(admin),
        }
    },
})

/**
 * Game links
 *
 * Used to share games.
 */
export const botGame = deeplinkBuilder<{
    /** Bot username */
    bot: string
    /** Game short name */
    game: string
}>({
    internalBuild: ({ bot, game }) => ['resolve', { domain: bot, game }],
    internalParse: (path, query) => {
        if (path !== 'resolve') return null

        const bot = query.get('domain')
        const game = query.get('game')

        if (!bot || !game) return null

        return { bot, game }
    },
    externalBuild: ({ bot, game }) => [bot, { game }],
    externalParse: (path, query) => {
        if (path.includes('/') || path[0] === '+' || path.length <= 2) return null

        const bot = path
        const game = query.get('game')

        if (!game) return null

        return { bot, game }
    },
})

/**
 * Named bot web app links
 *
 * Used to share named bot web apps.
 *
 * These links are different from bot attachment menu deep links,
 * because they don't require the user to install an attachment menu,
 * and a single bot can offer multiple named web apps, distinguished by
 * their `short_name`.
 */
export const botWebApp = deeplinkBuilder<{
    /** Bot username */
    bot: string
    /** App short name */
    app: string
    /** Parameter to be passed by the client to messages.requestAppWebView as `start_param` */
    parameter?: string
}>({
    internalBuild: ({ bot, app, parameter }) => ['resolve', { domain: bot, appname: app, startapp: parameter }],
    internalParse: (path, query) => {
        if (path !== 'resolve') return null

        const bot = query.get('domain')
        const app = query.get('appname')
        const parameter = query.get('startapp')

        if (!bot || !app) return null

        return { bot, app, parameter: parameter || undefined }
    },

    externalBuild: ({ bot, app, parameter }) => [`${bot}/${app}`, { startapp: parameter }],
    externalParse: (path, query) => {
        const [bot, app, rest] = path.split('/')

        if (!app || rest) return null

        const parameter = query.get('startapp')

        return { bot, app, parameter: parameter || undefined }
    },
})
