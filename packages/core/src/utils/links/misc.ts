import { deeplinkBuilder } from './common.js'

/**
 * Share links
 *
 * Used to share a prepared message and URL into a chosen chat's text field.
 */
export const share = deeplinkBuilder<{ url: string; text?: string }>({
    internalBuild: ({ url, text }) => ['msg_url', { url, text }],
    internalParse: (path, query) => {
        if (path !== 'msg_url') return null

        const url = query.get('url')
        if (!url) return null

        const text = query.get('text')

        return { url, text: text || undefined }
    },
    externalBuild: ({ url, text }) => ['share', { url, text }],
    externalParse: (path, query) => {
        if (path !== 'share') return null

        const url = query.get('url')
        if (!url) return null

        const text = query.get('text')

        return { url, text: text || undefined }
    },
})

/**
 * Boost links
 *
 * Used by users to boost channels, granting them the ability to post stories.
 */
export const boost = deeplinkBuilder<{ username: string } | { channelId: number }>({
    internalBuild: (params) => {
        if ('username' in params) {
            return ['boost', { domain: params.username }]
        }

        return ['boost', { channel: params.channelId }]
    },
    internalParse: (path, query) => {
        if (path !== 'boost') return null

        const username = query.get('domain')

        if (username) {
            return { username }
        }

        const channelId = Number(query.get('channel'))

        if (!isNaN(channelId)) {
            return { channelId: Number(channelId) }
        }

        return null
    },
    externalBuild: (params) => {
        if ('username' in params) {
            return [params.username, { boost: true }]
        }

        return [`c/${params.channelId}`, { boost: true }]
    },
    externalParse: (path, query) => {
        if (!query.has('boost')) return null

        if (path.startsWith('c/')) {
            const channelId = Number(path.slice(2))
            if (isNaN(channelId)) return null

            return { channelId }
        }

        if (path.includes('/')) return null

        return { username: path }
    },
})

/**
 * Link to a shared folder (chat list)
 */
export const folder = deeplinkBuilder<{ slug: string }>({
    // tg://addlist?slug=XXX
    internalBuild: ({ slug }) => ['addlist', { slug }],
    internalParse: (path, query) => {
        if (path !== 'addlist') return null

        const slug = query.get('slug')
        if (!slug) return null

        return { slug }
    },

    // https://t.me/addlist/XXX
    externalBuild: ({ slug }) => [`addlist/${slug}`, null],
    externalParse: (path) => {
        const [prefix, slug] = path.split('/')
        if (prefix !== 'addlist') return null

        return { slug }
    },
})
