import * as fs from 'fs'
import { globSync } from 'glob'
import { join } from 'path'
import { fileURLToPath } from 'url'

// for whatever reason, jsr's npm compatibility jayer doesn't remove
// original typescript source files, which results in type errors when
// trying to build the project. this script removes all source files from @jsr/*
// https://discord.com/channels/684898665143206084/1203185670508515399/1234222204044967967

const nodeModules = fileURLToPath(new URL('../node_modules', import.meta.url))

let count = 0

for (const file of globSync(join(nodeModules, '.pnpm/**/node_modules/@jsr/**/*.ts'))) {
    if (file.endsWith('.d.ts')) continue
    if (!fs.existsSync(file)) continue

    fs.unlinkSync(file)
    count++
}

console.log(`[jsr] removed ${count} source files`)
