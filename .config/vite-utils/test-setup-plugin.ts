import { fileURLToPath } from 'node:url'

import type { Plugin } from 'vite'

const setupFile = fileURLToPath(new URL('./test-setup.ts', import.meta.url))

export function testSetup(params?: { additionalCode?: string }): Plugin {
    const { additionalCode = '' } = params || {}

    return {
        name: 'test-setup',
        async transform(code, id) {
            if (!id.match(/\.test\.m?[tj]s/)) return

            return {
                code: `import '${setupFile}'\n${additionalCode}${code}`,
                map: null,
            }
        },
        apply: 'build',
    }
}
