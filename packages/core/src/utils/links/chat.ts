/* eslint-disable indent,func-call-spacing */
import { deeplinkBuilder } from './common.js'

/**
 * Chat invite links
 *
 * Used to invite users to private groups and channels
 */
export const chatInvite = deeplinkBuilder<{ hash: string }>({
    internalBuild: ({ hash }) => ['join', { invite: hash }],
    internalParse: (path, query) => {
        if (path !== 'join') return null

        const invite = query.get('invite')
        if (!invite) return null

        return { hash: invite }
    },
    externalBuild: ({ hash }) => [`+${hash}`, null],
    externalParse: (path) => {
        const m = path.match(/^(?:\+|joinchat\/)([a-zA-Z0-9_-]+)$/)
        if (!m) return null

        if (m[1].match(/^[0-9]+$/)) {
            // phone number
            return null
        }

        return { hash: m[1] }
    },
})

/**
 * Chat folder links
 */
export const chatFolder = deeplinkBuilder<{ slug: string }>({
    internalBuild: ({ slug }) => ['addlist', { slug }],
    internalParse: (path, query) => {
        if (path !== 'addlist') return null

        const slug = query.get('slug')
        if (!slug) return null

        return { slug }
    },
    externalBuild: ({ slug }) => [`addlist/${slug}`, null],
    externalParse: (path) => {
        const [prefix, slug] = path.split('/')
        if (prefix !== 'addlist') return null

        return { slug }
    },
})

function parseMediaTimestamp(timestamp: string) {
    let m

    if ((m = timestamp.match(/^(\d+)$/))) {
        return Number(m[1])
    }

    if ((m = timestamp.match(/^(\d+):(\d{1,2})$/))) {
        return Number(m[1]) * 60 + Number(m[2])
    }

    if ((m = timestamp.match(/^(?:(\d+)h)?(?:(\d{1,2})m)?(?:(\d{1,2})s)$/))) {
        return (Number(m[1]) || 0) * 3600 + (Number(m[2]) || 0) * 60 + (Number(m[3]) || 0)
    }

    return undefined
}

/**
 * Message links
 *
 * Used to link to specific messages in public or private groups and channels.
 *
 * Note: `channelId` is a non-marked channel ID
 */
export const message = deeplinkBuilder<
    ({ username: string } | { channelId: number }) & {
        /** Message ID */
        id: number
        /** Thread ID */
        threadId?: number

        /**
         * For comments, `id` will contain the message ID of the channel message that started
         * the comment section and this field will contain the message ID of the comment in
         * the discussion group.
         */
        commentId?: number

        /**
         * Timestamp at which to start playing the media file present
         * in the body or in the webpage preview of the message
         */
        mediaTimestamp?: number

        /**
         * Whether this is a link to a specific message in the album or to the entire album
         */
        single?: boolean
    }
>({
    internalBuild: (params) => {
        const common = {
            post: params.id,
            thread: params.threadId,
            comment: params.commentId,
            t: params.mediaTimestamp,
            single: params.single ? '' : undefined,
        }

        if ('username' in params) {
            return ['resolve', { domain: params.username, ...common }]
        }

        return ['privatepost', { channel: params.channelId, ...common }]
    },
    internalParse: (path, query) => {
        const common = {
            id: Number(query.get('post')),
            threadId: query.has('thread') ? Number(query.get('thread')) : undefined,
            commentId: query.has('comment') ? Number(query.get('comment')) : undefined,
            mediaTimestamp: query.has('t') ? parseMediaTimestamp(query.get('t')!) : undefined,
            single: query.has('single'),
        }

        if (path === 'resolve') {
            const username = query.get('domain')
            if (!username) return null

            return { username, ...common }
        }

        if (path === 'privatepost') {
            const channelId = Number(query.get('channel'))
            if (!channelId) return null

            return { channelId, ...common }
        }

        return null
    },

    externalBuild: (params) => {
        const common = {
            comment: params.commentId,
            t: params.mediaTimestamp,
            single: params.single ? '' : undefined,
        }

        if ('username' in params) {
            if (params.threadId) {
                return [`${params.username}/${params.threadId}/${params.id}`, common]
            }

            return [`${params.username}/${params.id}`, common]
        }

        if (params.threadId) {
            return [`c/${params.channelId}/${params.threadId}/${params.id}`, common]
        }

        return [`c/${params.channelId}/${params.id}`, common]
    },
    externalParse: (path, query) => {
        const chunks = path.split('/')

        if (chunks.length < 2) return null

        const id = Number(chunks[chunks.length - 1])
        if (isNaN(id)) return null

        const common = {
            id,
            commentId: query.has('comment') ? Number(query.get('comment')) : undefined,
            mediaTimestamp: query.has('t') ? parseMediaTimestamp(query.get('t')!) : undefined,
            single: query.has('single'),
        }

        if (chunks[0] === 'c') {
            const channelId = Number(chunks[1])
            if (isNaN(channelId)) return null

            return {
                channelId,
                threadId: chunks[3] ? Number(chunks[2]) : undefined,
                ...common,
            }
        }

        const username = chunks[0]
        if (username[0] === '+') return null

        return {
            username,
            threadId: chunks[2] ? Number(chunks[1]) : undefined,
            ...common,
        }
    },
})
