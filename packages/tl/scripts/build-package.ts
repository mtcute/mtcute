import * as fsp from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parsePackageJsonFile, processPackageJson } from '@fuman/build'
import { packageJsonToDeno } from '@fuman/build/jsr'

async function transformFile(file: string, transform: (content: string, file: string) => string) {
  const content = await fsp.readFile(file, 'utf8')
  const res = transform(content, file)
  if (res != null) await fsp.writeFile(file, res)
}

// create package by copying all the needed files
const packageDir = fileURLToPath(new URL('../', import.meta.url))
const outDir = process.env.FUMAN_BUILD_OUT ?? fileURLToPath(new URL('../dist', import.meta.url))

await fsp.rm(outDir, { recursive: true, force: true })

const files = [
  'binary/reader.d.ts',
  'binary/reader.js',
  'binary/rsa-keys.d.ts',
  'binary/rsa-keys.js',
  'binary/writer.d.ts',
  'binary/writer.js',
  'compat/reader.js',
  'compat/index.d.ts',
  'compat/reader.d.ts',
  'compat/reader.js',
  'index.d.ts',
  'index.js',
  'raw-errors.json',
  'mtp-schema.json',
  'api-schema.json',
  'app-config.json',
  'README.md',
]

await fsp.mkdir(resolve(outDir, 'binary'), { recursive: true })
await fsp.mkdir(resolve(outDir, 'compat'), { recursive: true })

for (const f of files) {
  await fsp.copyFile(resolve(packageDir, f), resolve(outDir, f))
}

await fsp.cp(new URL('../../../LICENSE', import.meta.url), resolve(outDir, 'LICENSE'), { recursive: true })

const { packageJson, packageJsonOrig } = processPackageJson({
  packageJson: await parsePackageJsonFile(resolve(packageDir, 'package.json')),
  workspaceVersions: {},
  rootPackageJson: await parsePackageJsonFile(resolve(packageDir, '../../package.json')),
})

if (process.env.JSR) {
  // jsr doesn't support cjs, so we'll need to add some shims
  // todo: remove this god awfulness when tl esm rewrite
  await transformFile(resolve(outDir, 'index.js'), (content) => {
    return [
      '/// <reference types="./index.d.ts" />',
      'const exports = {};',
      content,
      'export const tl = exports.tl;',
      'export const mtp = exports.mtp;',
    ].join('\n')
  })
  await transformFile(resolve(outDir, 'binary/reader.js'), (content) => {
    return [
      '/// <reference types="./reader.d.ts" />',
      'const exports = {};',
      content,
      'export const __tlReaderMap = exports.__tlReaderMap;',
    ].join('\n')
  })
  await transformFile(resolve(outDir, 'binary/writer.js'), (content) => {
    return [
      '/// <reference types="./writer.d.ts" />',
      'const exports = {};',
      content,
      'export const __tlWriterMap = exports.__tlWriterMap;',
    ].join('\n')
  })
  await transformFile(resolve(outDir, 'binary/rsa-keys.js'), (content) => {
    return [
      '/// <reference types="./rsa-keys.d.ts" />',
      'const exports = {};',
      content,
      'export const __publicKeyIndex = exports.__publicKeyIndex;',
    ].join('\n')
  })
  await transformFile(resolve(outDir, 'compat/reader.js'), (content) => {
    return [
      '/// <reference types="./reader.d.ts" />',
      'const exports = {};',
      content,
      'export const __tlReaderMapCompat = exports.__tlReaderMapCompat;',
    ].join('\n')
  })

  // patch deno.json to add some export maps
  const denoJson = packageJsonToDeno({
    packageJson,
    packageJsonOrig,
    workspaceVersions: {},
    buildDirName: 'dist',
  })
  denoJson.exports = {
    './compat': './compat/index.d.ts',
  }

  for (const f of files) {
    if (!f.match(/\.js(?:on)?$/)) continue
    if (f === 'index.js') {
      denoJson.exports['.'] = './index.js'
    } else {
      denoJson.exports[`./${f}`] = `./${f}`
    }
  }
  await fsp.writeFile(resolve(outDir, 'deno.json'), JSON.stringify(denoJson, null, 2))
} else {
  await fsp.writeFile(resolve(outDir, 'package.json'), JSON.stringify(packageJson, null, 2))
}
