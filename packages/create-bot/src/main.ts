#!/usr/bin/env node
import * as colors from 'colorette'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { askForConfig } from './cli.js'
import { installDependencies } from './dependencies.js'
import { MtcuteFeature } from './features/types.js'
import { getExecCommand, getPackageManager, PackageManager } from './package-manager.js'
import { runTemplater } from './templater.js'
import { exec } from './utils.js'

const projectName = process.argv[2]

if (!projectName) {
    console.error('Usage: create-mtcute-bot <project-name>')
    process.exit(1)
}

const packageManager = getPackageManager()

if (packageManager === PackageManager.Bun) {
    console.log(`${colors.red('‼️ Warning:')} ${colors.yellow('Bun')} support is ${colors.bold('experimental')}`)
}

const config = await askForConfig(packageManager)
config.name = projectName
const outDir = process.env.TARGET_DIR || join(process.cwd(), projectName)

const __dirname = dirname(fileURLToPath(import.meta.url))

await runTemplater(join(__dirname, '../template'), outDir, config)

await installDependencies(outDir, config)

await exec(outDir, 'git', 'init')

if (config.features.includes(MtcuteFeature.Linters)) {
    if (process.platform === 'win32') {
        // windows doesn't track executable bit, but git does
        await exec(outDir, 'git', 'update-index', '--chmod=+x', '.husky/pre-commit')
    } else {
        await exec(outDir, 'chmod', '+x', '.husky/pre-commit')
    }

    await exec(outDir, ...getExecCommand(config.packageManager, 'husky'))
}

console.log(`✅ Scaffolded new project at ${colors.blue(outDir)}`)
console.log('🚀 Run it with:')
console.log(`  ${colors.blue('$')} cd ${projectName}`)
console.log(`  ${colors.blue('$')} ${config.packageManager} start`)
