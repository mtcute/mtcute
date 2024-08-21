/* eslint-disable node/prefer-global/process */
import * as cp from 'node:child_process'
import { fileURLToPath } from 'node:url'

const configPath = fileURLToPath(new URL('../.config/vite.build.ts', import.meta.url))

export function runViteBuildSync(packageName) {
    cp.execSync(`pnpm exec vite build --config "${configPath}"`, {
        stdio: 'inherit',
        cwd: fileURLToPath(new URL(`../packages/${packageName}`, import.meta.url)),
    })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const PACKAGE_NAME = process.argv[2]

    if (!PACKAGE_NAME) {
        throw new Error('package name not specified')
    }

    runViteBuildSync(PACKAGE_NAME)
}
