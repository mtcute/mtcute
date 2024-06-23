#!/usr/bin/env node
import * as colors from 'colorette'
import { basename, dirname, join } from 'node:path'
import process from 'node:process'
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

if (packageManager === PackageManager.Deno) {
    console.log(`${colors.red('‼️ Warning:')} ${colors.yellow('Deno')} support is ${colors.bold('experimental')}`)
}

const config = await askForConfig(packageManager)
config.name = basename(projectName)
let outDir = process.env.TARGET_DIR || projectName

if (!outDir.match(/^([A-Za-z]:)?[/\\]/)) {
    // assume it's a relative path
    outDir = join(process.cwd(), outDir)
}

const __dirname = dirname(fileURLToPath(import.meta.url))

await runTemplater(join(__dirname, '../template'), outDir, config)

await installDependencies(outDir, config)

if (config.features.includes(MtcuteFeature.Linters)) {
    await exec(outDir, ...getExecCommand(config.packageManager, 'eslint', '--fix', '.'))
}

if (config.features.includes(MtcuteFeature.Git)) {
    await exec(outDir, 'git', 'init', '.', '--initial-branch', 'main')
    await exec(outDir, 'git', 'add', '.')
    await exec(outDir, 'git', 'commit', '-m', 'Initial commit')
}

console.log(`✅ Scaffolded new project at ${colors.blue(outDir)}`)
console.log('🚀 Run it with:')
console.log(`  ${colors.blue('$')} cd ${projectName}`)

if (config.packageManager === PackageManager.Deno) {
    console.log(`  ${colors.blue('$')} deno task start`)
    // for whatever reason, deno keeps hanging after the we finish
    // and doesn't even handle SIGINT. just exit lol
    process.exit(0)
} else {
    console.log(`  ${colors.blue('$')} ${config.packageManager} start`)
}
