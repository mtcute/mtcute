import { join, resolve } from 'node:path'
import * as fs from 'node:fs'

import { globSync } from 'glob'

export function collectTestEntrypoints(params: { skipPackages: string[], skipTests: string[] }) {
    const files: string[] = []

    // eslint-disable-next-line no-restricted-globals
    const packages = resolve(__dirname, '../../packages')

    const skipTests = params.skipTests.map(path => resolve(packages, path))

    for (const dir of fs.readdirSync(packages)) {
        if (dir.startsWith('.') || params.skipPackages.includes(dir)) continue
        if (!fs.statSync(resolve(packages, dir)).isDirectory()) continue

        const fullDir = resolve(packages, dir)

        for (const file of globSync(join(fullDir, '**/*.test.ts'))) {
            if (skipTests.includes(file)) continue
            if (file.match(/\/(node_modules|dist)\//)) continue
            files.push(file)
        }
    }

    return files
}
