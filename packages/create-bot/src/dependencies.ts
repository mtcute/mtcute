import type { UserConfig } from './cli.js'

import { join } from 'node:path'
import { MtcuteFeature } from './features/types.js'
import { fetchAllLatestVersionsJsr } from './jsr.js'
import { getInstallCommand, PackageManager } from './package-manager.js'
import { exec } from './utils.js'

export interface DependenciesList {
    dependencies: string[]
    devDependencies: string[]
}

export function buildDependenciesList(config: UserConfig): DependenciesList {
    const dependencies = []
    const devDependencies = []

    if (config.packageManager === PackageManager.Bun) {
        dependencies.push('@mtcute/bun')
    } else if (config.packageManager === PackageManager.Deno) {
        dependencies.push('@std/dotenv', '@mtcute/deno')
    } else {
        // node
        dependencies.push('dotenv-cli', '@mtcute/node')
    }

    if (config.features.includes(MtcuteFeature.Dispatcher)) {
        dependencies.push('@mtcute/dispatcher')
    }

    if (config.features.includes(MtcuteFeature.I18n)) {
        dependencies.push('@mtcute/i18n')
    }

    if (config.features.includes(MtcuteFeature.TypeScript) && config.packageManager !== PackageManager.Deno) {
        devDependencies.push('typescript', '@types/node')

        if (config.packageManager === PackageManager.Bun) {
            devDependencies.push('@types/bun')
        } else {
            // node can't handle typescript natively
            dependencies.push('tsx')
        }
    }

    if (config.features.includes(MtcuteFeature.Envalid)) {
        dependencies.push('dotenv', 'envalid')
    }

    if (config.features.includes(MtcuteFeature.Linters)) {
        devDependencies.push('@antfu/eslint-config')
    }

    return {
        dependencies,
        devDependencies,
    }
}

export async function installDependencies(cwd: string, config: UserConfig): Promise<void> {
    const { dependencies, devDependencies } = buildDependenciesList(config)

    if (config.packageManager === PackageManager.Deno) {
        // deno doesn't have a package manager per se, but we can generate an import map
        // to basically achieve the same thing
        //
        // since we don't have a package manager, we have to resolve "latest" versions ourselves :c
        // additionally, there's no notion of "dev" dependencies is deno. though fairly enough,
        // there should be no dev deps in our deno template (but let's just keep it for consistency)

        const allDeps = [...dependencies, ...devDependencies]
        const versions = await fetchAllLatestVersionsJsr(allDeps)

        const denoJson = {
            imports: {} as Record<string, string>,
            tasks: {
                start: `deno run -A --unstable-ffi ./src/main.${
                    config.features.includes(MtcuteFeature.TypeScript) ? 'ts' : 'js'
                }`,
            },
        }

        for (const dep of allDeps) {
            denoJson.imports[dep] = `jsr:${dep}@^${versions.get(dep)!}`
        }

        await Deno.writeTextFile(join(cwd, 'deno.json'), JSON.stringify(denoJson, null, 4))

        return
    }

    await exec(cwd, ...getInstallCommand({ mgr: config.packageManager, packages: dependencies }))

    if (devDependencies.length) {
        await exec(cwd, ...getInstallCommand({ mgr: config.packageManager, packages: devDependencies, dev: true }))
    }
}
