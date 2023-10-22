import { deeplinkBuilder } from './common.js'

/**
 * Sticker set links
 *
 * Used to import stickersets or custom emoji stickersets
 */
export const stickerset = deeplinkBuilder<{
    slug: string
    emoji?: boolean
}>({
    internalBuild: ({ slug, emoji }) => [emoji ? 'addemoji' : 'addstickers', { set: slug }],
    internalParse: (path, query) => {
        if (path !== 'addstickers' && path !== 'addemoji') return null

        const slug = query.get('set')
        if (!slug) return null

        return { slug, emoji: path === 'addemoji' }
    },
    externalBuild: ({ slug, emoji }) => [`${emoji ? 'addemoji' : 'addstickers'}/${slug}`, null],
    externalParse: (path) => {
        const [prefix, slug] = path.split('/')
        if (prefix !== 'addstickers' && prefix !== 'addemoji') return null

        return { slug, emoji: prefix === 'addemoji' }
    },
})
