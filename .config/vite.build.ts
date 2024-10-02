/// <reference types="vitest" />
import { cpSync, existsSync, writeFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { ConfigEnv, UserConfig } from 'vite'
import { nodeExternals } from 'rollup-plugin-node-externals'
import dts from 'vite-plugin-dts'

import { processPackageJson } from './vite-utils/package-json'

const rootDir = fileURLToPath(new URL('..', import.meta.url))

export default async (env: ConfigEnv): Promise<UserConfig> => {
    if (env.command !== 'build') {
        throw new Error('This config is only for building')
    }

    const { packageJson, entrypoints } = processPackageJson(process.cwd())

    let customConfig: any
    try {
        const mod = await import(resolve(process.cwd(), 'build.config.js'))
        customConfig = await mod.default()
    } catch (e) {
        if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e
    }

    const CJS_DEPRECATION_WARNING = `
if (typeof globalThis !== 'undefined' && !globalThis._MTCUTE_CJS_DEPRECATION_WARNED) { 
    globalThis._MTCUTE_CJS_DEPRECATION_WARNED = true
    console.warn("[${packageJson.name}] CommonJS support is deprecated and will be removed soon. Please consider switching to ESM, it's "+(new Date()).getFullYear()+" already.")
    console.warn("[${packageJson.name}] Learn more about switching to ESM: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c")
}
    `.trim()

    if (customConfig?.preBuild) {
        await customConfig.preBuild()
    }

    return {
        build: {
            rollupOptions: {
                plugins: [
                    ...(customConfig?.rollupPluginsPre ?? []),
                    nodeExternals({
                        builtinsPrefix: 'ignore',
                    }),
                    {
                        name: 'mtcute-finalize',
                        renderChunk(code, chunk, options) {
                            if (options.format !== 'cjs') return null

                            return `${CJS_DEPRECATION_WARNING}\n${code}`
                        },
                        async closeBundle() {
                            const packageDir = process.cwd()
                            const outDir = resolve(packageDir, 'dist')

                            customConfig?.finalPackageJson?.(packageJson)

                            writeFileSync(resolve(outDir, 'package.json'), JSON.stringify(packageJson, null, 4))
                            cpSync(resolve(rootDir, 'LICENSE'), resolve(outDir, 'LICENSE'))
                            cpSync(resolve(process.cwd(), 'README.md'), resolve(outDir, 'README.md'))

                            if (existsSync(resolve(outDir, 'chunks/cjs'))) {
                                // write {"type":"commonjs"} into chunks/cjs so that node doesn't complain
                                const cjsFile = resolve(outDir, 'chunks/cjs/package.json')
                                writeFileSync(cjsFile, JSON.stringify({ type: 'commonjs' }, null, 4))
                            }

                            for (const [name, entry] of Object.entries(entrypoints)) {
                                const dTsFile = resolve(outDir, `${name}.d.ts`)
                                if (!existsSync(dTsFile)) {
                                    const entryTypings = resolve(outDir, entry.replace('/src/', '/').replace(/\.ts$/, '.d.ts'))
                                    if (!existsSync(entryTypings)) continue

                                    const relativePath = relative(outDir, entryTypings)
                                    writeFileSync(dTsFile, `export * from './${relativePath.replace(/\.d\.ts$/, '.js')}'`)
                                }

                                cpSync(dTsFile, dTsFile.replace(/\.d\.ts$/, '.d.cts'))
                            }

                            await customConfig?.final?.({ outDir, packageDir })
                        },
                    },
                    ...(customConfig?.rollupPluginsPost ?? []),
                ],
                output: {
                    minifyInternalExports: false,
                    chunkFileNames: 'chunks/[format]/[hash].js',
                },
                external: customConfig?.external,
            },
            lib: {
                entry: entrypoints as any,
                formats: customConfig?.buildCjs === false ? ['es'] : ['es', 'cjs'],
            },
            minify: false,
            outDir: 'dist',
            emptyOutDir: true,
            target: 'es2022',
        },
        plugins: [
            ...(customConfig?.vitePlugins ?? []),
            dts({
                // broken; see https://github.com/qmhc/vite-plugin-dts/issues/321, https://github.com/microsoft/rushstack/issues/3557
                // rollupTypes: true,
            }),
        ],
    }
}
