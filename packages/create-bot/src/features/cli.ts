import type { CheckboxChoiceOptions } from 'inquirer'

import { PackageManager } from '../package-manager.js'

import { MtcuteFeature } from './types.js'

export function getFeatureChoices(packageMananger: PackageManager): CheckboxChoiceOptions[] {
    const arr: CheckboxChoiceOptions[] = [
        {
            name: ' 🌐 Internationalization',
            short: 'i18n',
            value: MtcuteFeature.I18n,
        },
        {
            name: ' 📨 Event dispatcher',
            short: 'Dispatcher',
            value: MtcuteFeature.Dispatcher,
            checked: true,
        },
        {
            name: ' ✨ Use TypeScript',
            short: 'TypeScript',
            value: MtcuteFeature.TypeScript,
            checked: true,
        },
        {
            name: ' 📦 Initialize git repository',
            short: 'Git',
            value: MtcuteFeature.Git,
            checked: true,
        },
    ]

    if (packageMananger !== PackageManager.Deno) {
        arr.unshift({
            name: ' 🥰 Setup ESLint with @antfu/eslint-config',
            short: 'Linters',
            value: MtcuteFeature.Linters,
            checked: true,
        })
    }

    if (packageMananger === PackageManager.Pnpm) {
        // todo: add support for dockerfile generation for other package managers
        arr.push({
            name: ' 🐳 Generate Dockerfile',
            short: 'Dockerfile',
            value: MtcuteFeature.Docker,
            checked: true,
        })
    }

    return arr
}
