import { deeplinkBuilder } from './common.js'

/**
 * Public username links
 *
 * Used to link to public users, groups and channels
 */
export const publicUsername = deeplinkBuilder<{ username: string }>({
    internalBuild: ({ username }) => ['resolve', { domain: username }],
    internalParse: (path, query) => {
        if (path !== 'resolve') return null

        const domain = query.get('domain')
        if (!domain) return null

        // might be some more precise deeplink
        if ([...query.keys()].length > 1) return null

        return { username: domain }
    },
    externalBuild: ({ username }) => [username, null],
    externalParse: (path, query) => {
        if (path.length <= 1 || path.includes('/') || path[0] === '+') return null

        if ([...query.keys()].length > 0) return null

        return { username: path }
    },
})

/**
 * Temporary profile links
 *
 * Used to link to user profiles, generated using contacts.exportContactToken.
 * These links can be generated even for profiles that don't have a username,
 * and they have an expiration date, specified by the expires field of the exportedContactToken
 * constructor returned by contacts.exportContactToken.
 */
export const temporaryProfile = deeplinkBuilder<{ token: string }>({
    internalBuild: ({ token }) => ['contact', { token }],
    internalParse: (path, query) => {
        if (path !== 'contact') return null

        const token = query.get('token')
        if (!token) return null

        return { token }
    },
    externalBuild: ({ token }) => [`contact/${token}`, null],
    externalParse: (path) => {
        const [prefix, token] = path.split('/')
        if (prefix !== 'contact') return null

        return { token }
    },
})

/**
 * Phone number links
 *
 * Used to link to public and private users by their phone number.
 */
export const phoneNumber = deeplinkBuilder<{ phone: string }>({
    internalBuild: ({ phone }) => ['resolve', { phone }],
    internalParse: (path, query) => {
        if (path !== 'resolve') return null

        const phone = query.get('phone')
        if (!phone) return null

        return { phone }
    },
    externalBuild: ({ phone }) => [`+${phone}`, null],
    externalParse: (path) => {
        const m = path.match(/^\+(\d+)$/)
        if (!m) return null

        return { phone: m[1] }
    },
})
