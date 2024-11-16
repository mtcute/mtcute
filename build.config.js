/** @type {import('@fuman/build').RootConfig} */
export default {
    jsr: {
        exclude: ['**/*.{test,bench,test-utils}.ts', '**/__fixtures__/**'],
        sourceDir: 'src',
        transformCode: (path, code) => {
            // add shims for node-specific APIs and replace NodeJS.* types
            // pretty fragile, but it works for now
            // todo: remove this god awfulness and use `declare const` in-place instead

            const typesToReplace = {
                'NodeJS\\.Timeout': 'number',
                'NodeJS\\.Immediate': 'number',
            }
            const nodeSpecificApis = {
                setImmediate: '(cb: (...args: any[]) => void, ...args: any[]) => number',
                clearImmediate: '(id: number) => void',
                Buffer:
                '{ '
                + 'concat: (...args: any[]) => Uint8Array, '
                + 'from: (data: any, encoding?: string) => { toString(encoding?: string): string }, '
                + ' }',
                SharedWorker: ['type', 'never'],
                WorkerGlobalScope:
                '{ '
                + '  new (): typeof WorkerGlobalScope, '
                + '  postMessage: (message: any, transfer?: Transferable[]) => void, '
                + '  addEventListener: (type: "message", listener: (ev: MessageEvent) => void) => void, '
                + ' }',
                process: '{ ' + 'hrtime: { bigint: () => bigint }, ' + '}',
            }

            for (const [name, decl_] of Object.entries(nodeSpecificApis)) {
                if (code.includes(name)) {
                    if (name === 'Buffer' && code.includes('node:buffer')) continue

                    const isType = Array.isArray(decl_) && decl_[0] === 'type'
                    const decl = isType ? decl_[1] : decl_

                    if (isType) {
                        code = `declare type ${name} = ${decl};\n${code}`
                    } else {
                        code = `declare const ${name}: ${decl};\n${code}`
                    }
                }
            }

            for (const [oldType, newType] of Object.entries(typesToReplace)) {
                if (code.match(oldType)) {
                    code = code.replace(new RegExp(oldType, 'g'), newType)
                }
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
    },
    viteConfig: '.config/vite.build.ts',
}
