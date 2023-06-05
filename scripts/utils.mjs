import { readdir, readFile } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

export const rootDir = join(dirname(fileURLToPath(import.meta.url)), '../')

export async function tryParsePackageJson(packageName) {
    try {
        const path = packageName === '$root' ? rootDir : join(rootDir, 'packages', packageName)

        return JSON.parse(
            await readFile(join(path, 'package.json'), 'utf-8'),
        )
    } catch (e) {
        if (e.code !== 'ENOENT') throw e

        return null
    }
}

export async function getPackageJsons(includeRoot = false) {
    const packages = (await readdir(join(rootDir, 'packages')))
        .filter((s) => !s.startsWith('.'))

    if (includeRoot) packages.push('$root')

    return Promise.all(packages.map(tryParsePackageJson))
}
