import { deeplinkBuilder } from './common.js'

/**
 * MTProxy links
 */
export const mtproxy = deeplinkBuilder<{
    server: string
    port: number
    secret: string
}>({
    internalBuild: (params) => ['proxy', params],
    externalBuild: (params) => ['proxy', params],
    internalParse: (path, query) => {
        if (path !== 'proxy') return null

        const server = query.get('server')
        const port = Number(query.get('port'))
        const secret = query.get('secret')

        if (!server || isNaN(port) || !secret) return null

        return { server, port, secret }
    },
    externalParse: (path, query) => {
        if (path !== 'proxy') return null

        const server = query.get('server')
        const port = Number(query.get('port'))
        const secret = query.get('secret')

        if (!server || isNaN(port) || !secret) return null

        return { server, port, secret }
    },
})

/**
 * Socks5 proxy links
 */
export const socks5 = deeplinkBuilder<{
    server: string
    port: number
    user?: string
    pass?: string
}>({
    internalBuild: (params) => ['socks', params],
    externalBuild: (params) => ['socks', params],
    internalParse: (path, query) => {
        if (path !== 'socks') return null

        const server = query.get('server')
        const port = Number(query.get('port'))
        const user = query.get('user')
        const pass = query.get('pass')

        if (!server || isNaN(port)) return null

        return { server, port, user: user || undefined, pass: pass || undefined }
    },
    externalParse: (path, query) => {
        if (path !== 'socks') return null

        const server = query.get('server')
        const port = Number(query.get('port'))
        const user = query.get('user')
        const pass = query.get('pass')

        if (!server || isNaN(port)) return null

        return { server, port, user: user || undefined, pass: pass || undefined }
    },
})
