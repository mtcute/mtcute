import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { asNonNull } from '@fuman/utils'

/** @type {import('@fuman/build').RootConfig} */
export default {
    jsr: {
        exclude: ['**/*.{test,bench,test-utils}.ts', '**/__fixtures__/**'],
        sourceDir: 'src',
        transformCode: (path, code) => {
            if (!path.endsWith('.ts')) return code
            if (!code.match('<deno-(insert|remove|tsignore)>')) return code

            // deno is missing some types, so we have to add them manually
            // i dont want to manually write types for them, so we just declare them as `any` in a comment
            // and un-comment them when building for deno
            //
            // this way we can still have proper types in the code, while also being able to build for deno
            // very much a crutch, but welp, deno sucks

            let insertContent = code.match(/<deno-insert>(.*?)<\/deno-insert>/s)
            while (insertContent) {
                code = code.slice(0, insertContent.index)
                + insertContent[1].replace(/\/\/\s*/g, '')
                + code.slice(insertContent.index + insertContent[0].length)

                insertContent = code.match(/<deno-insert>(.*?)<\/deno-insert>/s)
            }

            let removeContent = code.match(/<deno-remove>(.*?)<\/deno-remove>/s)
            while (removeContent) {
                code = code.slice(0, removeContent.index) + code.slice(removeContent.index + removeContent[0].length)

                removeContent = code.match(/<deno-remove>(.*?)<\/deno-remove>/s)
            }

            let tsIgnoreContent = code.match(/\/\/\s*<deno-tsignore>/)
            while (tsIgnoreContent) {
                code = `${code.slice(0, tsIgnoreContent.index)}/* @ts-ignore */${code.slice(tsIgnoreContent.index + tsIgnoreContent[0].length)}`

                tsIgnoreContent = code.match(/\/\/\s*<deno-tsignore>/)
            }

            return code
        },
    },
    versioning: {
        exclude: [
            '**/*.test.ts',
            '**/*.test-utils.ts',
            '**/__fixtures__/**',
            '**/*.md',
            'typedoc.cjs',
            '{scripts,dist,tests,private}/**',
        ],
        beforeReleaseCommit: async (packages) => {
            const OUT_FILE = fileURLToPath(new URL('./latest-versions.json', import.meta.url))

            const versions = {}

            for (const { json, root } of packages) {
                if (root) continue
                versions[asNonNull(json.name)] = asNonNull(json.version)
            }

            await writeFile(OUT_FILE, JSON.stringify(versions, null, 4))
        },
    },
    typedoc: {
        excludePackages: [
            '@mtcute/tl',
            '@mtcute/create-bot',
        ],
        validation: {
            notExported: true,
            invalidLink: false,
            notDocumented: false,
        },
        plugin: [
            './.config/typedoc/plugin-external-links.js',
            './.config/typedoc/plugin-umami.js',
            './.config/typedoc/plugin-fix-cfpages.js',
        ],
        gitRemote: 'https://github.com/mtcute/mtcute',
    },
    viteConfig: '.config/vite.build.ts',
}
