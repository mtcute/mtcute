import * as fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

import { processPackageJson } from '../.config/vite-utils/package-json.js'

import { packageJsonToDeno, runJsrBuildSync } from './build-package-jsr.js'
import { runViteBuildSync } from './build-package-vite.js'

if (process.argv.length < 3) {
    console.log('Usage: build-package.js <package name>')
    process.exit(0)
}

const IS_JSR = process.env.JSR === '1'

const packageName = process.argv[2]

function transformFile(file, transform) {
    const content = fs.readFileSync(file, 'utf8')
    const res = transform(content, file)
    if (res != null) fs.writeFileSync(file, res)
}

if (packageName === 'tl') {
    // create package by copying all the needed files
    const packageDir = fileURLToPath(new URL('../packages/tl', import.meta.url))
    let outDir = fileURLToPath(new URL('../packages/tl/dist', import.meta.url))
    if (IS_JSR) outDir = resolve(outDir, 'jsr')

    fs.rmSync(outDir, { recursive: true, force: true })

    const files = [
        'binary/reader.d.ts',
        'binary/reader.js',
        'binary/rsa-keys.d.ts',
        'binary/rsa-keys.js',
        'binary/writer.d.ts',
        'binary/writer.js',
        'index.d.ts',
        'index.js',
        'raw-errors.json',
        'mtp-schema.json',
        'api-schema.json',
        'app-config.json',
        'README.md',
    ]

    fs.mkdirSync(resolve(outDir, 'binary'), { recursive: true })

    for (const f of files) {
        fs.copyFileSync(resolve(packageDir, f), resolve(outDir, f))
    }

    fs.cpSync(new URL('../LICENSE', import.meta.url), resolve(outDir, 'LICENSE'), { recursive: true })
    const { packageJson, packageJsonOrig } = processPackageJson(packageDir)

    if (IS_JSR) {
        // jsr doesn't support cjs, so we'll need to add some shims
        // todo: remove this god awfulness when tl esm rewrite
        transformFile(resolve(outDir, 'index.js'), (content) => {
            return [
                '/// <reference types="./index.d.ts" />',
                'const exports = {};',
                content,
                'export const tl = exports.tl;',
                'export const mtp = exports.mtp;',
            ].join('\n')
        })
        transformFile(resolve(outDir, 'binary/reader.js'), (content) => {
            return [
                '/// <reference types="./reader.d.ts" />',
                'const exports = {};',
                content,
                'export const __tlReaderMap = exports.__tlReaderMap;',
            ].join('\n')
        })
        transformFile(resolve(outDir, 'binary/writer.js'), (content) => {
            return [
                '/// <reference types="./writer.d.ts" />',
                'const exports = {};',
                content,
                'export const __tlWriterMap = exports.__tlWriterMap;',
            ].join('\n')
        })
        transformFile(resolve(outDir, 'binary/rsa-keys.js'), (content) => {
            return [
                '/// <reference types="./rsa-keys.d.ts" />',
                'const exports = {};',
                content,
                'export const __publicKeyIndex = exports.__publicKeyIndex;',
            ].join('\n')
        })

        // patch deno.json to add some export maps
        const denoJson = packageJsonToDeno({ packageJson, packageJsonOrig })
        denoJson.exports = {}

        for (const f of files) {
            if (!f.match(/\.js(?:on)?$/)) continue
            if (f === 'index.js') {
                denoJson.exports['.'] = './index.js'
            } else {
                denoJson.exports[`./${f}`] = `./${f}`
            }
        }
        fs.writeFileSync(resolve(outDir, 'deno.json'), JSON.stringify(denoJson, null, 2))
    } else {
        fs.writeFileSync(resolve(outDir, 'package.json'), JSON.stringify(packageJson, null, 2))
    }
} else {
    if (IS_JSR) {
        await runJsrBuildSync(packageName)
    } else {
        runViteBuildSync(packageName)
    }
}
