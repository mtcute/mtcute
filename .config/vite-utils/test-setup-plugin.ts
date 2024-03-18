import { Plugin } from 'vite'
import { fileURLToPath } from 'url'

const setupFile = fileURLToPath(new URL('./test-setup.mts', import.meta.url))

export function testSetup(params?: { additionalCode?: string }): Plugin {
    const { additionalCode = '' } = params || {}

    return {
        name: 'test-setup',
        async transform(code, id) {
            if (!id.match(/\.test\.m?[tj]s/)) return

            return {
                code: `import '${setupFile}'\n` + additionalCode + code,
                map: null,
            }
        },
        apply: 'build',
    }
}
