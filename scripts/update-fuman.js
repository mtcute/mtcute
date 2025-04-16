import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { collectPackageJsons } from '@fuman/build'

const packages = await collectPackageJsons(new URL('../', import.meta.url), true)

const _latestVersions = new Map()
async function fetchLatestVersion(name) {
    if (_latestVersions.has(name)) return _latestVersions.get(name)

    const res = await fetch(`https://registry.npmjs.org/${name}`)
    const json = await res.json()

    const latest = json['dist-tags'].latest

    _latestVersions.set(name, latest)

    return latest
}

for (const pkg of packages) {
    // too lazy to add a separate jsr support for just one package lol
    if (pkg.json.name === '@mtcute/deno') continue

    const jsonPath = join(pkg.path, 'package.json')
    // NB: pkg.json is parsed with zod which leads to modified field ordering
    const rawJson = JSON.parse(await readFile(jsonPath, 'utf8'))

    let changed = false
    for (const key of ['dependencies', 'devDependencies']) {
        const obj = rawJson[key]
        if (!obj) continue

        for (const [name, version] of Object.entries(obj)) {
            if (name.startsWith('@fuman/')) {
                const latest = await fetchLatestVersion(name)
                if (version !== latest) {
                    obj[name] = latest
                    changed = true
                }
            }
        }
    }

    if (changed) {
        await writeFile(jsonPath, JSON.stringify(rawJson, null, 2))
    }
}
