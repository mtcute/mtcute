import chalk from 'chalk'
import { join } from 'node:path'

import { askForConfig } from './cli.js'
import { installDependencies } from './dependencies.js'
import { runTemplater } from './templater.js'

const projectName = process.argv[2]

if (!projectName) {
    console.error('Usage: create-mtcute-bot <project-name>')
    process.exit(1)
}

const config = await askForConfig()
config.name = projectName
const outDir = process.env.TARGET_DIR || join(process.cwd(), projectName)

const __dirname = new URL('.', import.meta.url).pathname

await runTemplater(join(__dirname, '../template'), outDir, config)

await installDependencies(outDir, config)

console.log(`✅ Scaffolded new project at ${chalk.blue(outDir)}`)
console.log('🚀 Run it with:')
console.log(`  ${chalk.blue('$')} cd ${projectName}`)
console.log(`  ${chalk.blue('$')} pnpm run run`)
