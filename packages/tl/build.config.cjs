module.exports = ({ fs, path, outDir, packageDir, jsr, transformFile }) => ({
    buildTs: false,
    buildCjs: false,
    final() {
        // create package by copying all the needed files
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
        ]

        fs.mkdirSync(path.join(outDir, 'binary'), { recursive: true })

        for (const f of files) {
            fs.copyFileSync(path.join(packageDir, f), path.join(outDir, f))
        }

        if (jsr) {
            // jsr doesn't support cjs, so we'll need to add some shims
            // todo: remove this god awfulness when tl esm rewrite
            transformFile(path.join(outDir, 'index.js'), (content) => {
                return [
                    '/// <reference types="./index.d.ts" />',
                    'const exports = {};',
                    content,
                    'export const tl = exports.tl;',
                    'export const mtp = exports.mtp;',
                ].join('\n')
            })
            transformFile(path.join(outDir, 'binary/reader.js'), (content) => {
                return [
                    '/// <reference types="./reader.d.ts" />',
                    'const exports = {};',
                    content,
                    'export const __tlReaderMap = exports.__tlReaderMap;',
                ].join('\n')
            })
            transformFile(path.join(outDir, 'binary/writer.js'), (content) => {
                return [
                    '/// <reference types="./writer.d.ts" />',
                    'const exports = {};',
                    content,
                    'export const __tlWriterMap = exports.__tlWriterMap;',
                ].join('\n')
            })
            transformFile(path.join(outDir, 'binary/rsa-keys.js'), (content) => {
                return [
                    '/// <reference types="./rsa-keys.d.ts" />',
                    'const exports = {};',
                    content,
                    'export const __publicKeyIndex = exports.__publicKeyIndex;',
                ].join('\n')
            })

            // patch deno.json to add some export maps
            transformFile(path.join(outDir, 'deno.json'), (content) => {
                const json = JSON.parse(content)
                json.exports = {}

                for (const f of files) {
                    if (!f.match(/\.js(?:on)?$/)) continue

                    if (f === 'index.js') {
                        json.exports['.'] = './index.js'
                    } else {
                        json.exports[`./${f}`] = `./${f}`
                    }
                }

                return JSON.stringify(json, null, 2)
            })
        }
    },
})
