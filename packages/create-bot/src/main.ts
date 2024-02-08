import chalk from 'chalk'
import { join } from 'node:path'

import { askForConfig } from './cli.js'
import { installDependencies } from './dependencies.js'
import { MtcuteFeature } from './features/types.js'
import { runTemplater } from './templater.js'
import { exec } from './utils.js'

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

await exec(outDir, 'git', 'init')

if (config.features.includes(MtcuteFeature.Linters)) {
    if (process.platform === 'win32') {
        // windows doesn't track executable bit, but git does
        await exec(outDir, 'git', 'update-index', '--chmod=+x', '.husky/pre-commit')
    } else {
        await exec(outDir, 'chmod', '+x', '.husky/pre-commit')
    }

    await exec(outDir, 'pnpm', 'exec', 'husky', 'install')
}

console.log(`✅ Scaffolded new project at ${chalk.blue(outDir)}`)
console.log('🚀 Run it with:')
console.log(`  ${chalk.blue('$')} cd ${projectName}`)
console.log(`  ${chalk.blue('$')} pnpm start`)
