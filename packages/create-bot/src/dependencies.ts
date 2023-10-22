import { UserConfig } from './cli.js'
import { MtcuteFeature } from './features/types.js'
import { exec } from './utils.js'

export function buildDependenciesList(config: UserConfig) {
    const dependencies = ['@mtcute/node']
    const devDepdenencies = ['dotenv-cli']

    if (config.features.includes(MtcuteFeature.Dispatcher)) {
        dependencies.push('@mtcute/dispatcher')
    }

    if (config.features.includes(MtcuteFeature.I18n)) {
        dependencies.push('@mtcute/i18n')
    }

    if (config.features.includes(MtcuteFeature.NativeAddon)) {
        dependencies.push('@mtcute/crypto-node')
    }

    if (config.features.includes(MtcuteFeature.TypeScript)) {
        devDepdenencies.push('typescript', '@types/node')
    }

    if (config.features.includes(MtcuteFeature.Linters)) {
        devDepdenencies.push(
            'husky',
            'lint-staged',
            'eslint',
            'eslint-config-prettier',
            'eslint-plugin-ascii',
            'eslint-plugin-import',
            'eslint-plugin-simple-import-sort',
        )

        if (config.features.includes(MtcuteFeature.TypeScript)) {
            devDepdenencies.push(
                'eslint-import-resolver-typescript',
                '@typescript-eslint/eslint-plugin',
                '@typescript-eslint/parser',
            )
        }
    }

    return {
        dependencies,
        devDepdenencies,
    }
}

export async function installDependencies(cwd: string, config: UserConfig) {
    const { dependencies, devDepdenencies } = buildDependenciesList(config)

    await exec(cwd, 'pnpm', 'add', ...dependencies)
    await exec(cwd, 'pnpm', 'add', '--save-dev', ...devDepdenencies)
}
