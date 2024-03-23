import { UserConfig } from './cli.js'
import { MtcuteFeature } from './features/types.js'
import { getInstallCommand, PackageManager } from './package-manager.js'
import { exec } from './utils.js'

export function buildDependenciesList(config: UserConfig) {
    const dependencies = []
    const devDepdenencies = ['dotenv-cli']

    if (config.packageManager === PackageManager.Bun) {
        dependencies.push('@mtcute/bun')
    } else {
        dependencies.push('@mtcute/node')
    }

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
            'prettier',
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

    await exec(cwd, ...getInstallCommand({ mgr: config.packageManager, packages: dependencies }))
    await exec(cwd, ...getInstallCommand({ mgr: config.packageManager, packages: devDepdenencies, dev: true }))
}
