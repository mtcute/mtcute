import { fileURLToPath } from 'node:url'

/** @type {import('@fuman/build/vite').CustomBuildConfig} */
export default () => {
    const clientId = fileURLToPath(new URL('./src/client.ts', import.meta.url))

    return {
        viteConfig: {
            build: {
                rollupOptions: {
                    external: ['@mtcute/crypto-node'],
                },
            },
        },
        pluginsPre: [
            {
                // very much a crutch, but it works
                // i couldn't figure out a way to hook into the esm->cjs transform,
                // so i'm just replacing the await import with require and then back
                name: 'mtcute-node-build-plugin',
                transform(code, id) {
                    if (id === clientId) {
                        return code.replace('await import(', 'require(')
                    }

                    return code
                },
                generateBundle(output, bundle) {
                    if (output.format !== 'es') return

                    let found = false

                    for (const chunk of Object.values(bundle)) {
                        if (chunk.code.match(/require\("@mtcute\/crypto-node"\)/)) {
                            found = true
                            chunk.code = chunk.code.replace('require("@mtcute/crypto-node")', '(await import("@mtcute/crypto-node"))')
                        }
                    }

                    if (!found) {
                        throw new Error('Could not find crypto-node import')
                    }
                },
            },
        ],
    }
}
