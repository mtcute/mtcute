import { CheckboxChoiceOptions } from 'inquirer'

import { MtcuteFeature } from './types.js'

export function getFeatureChoices(): CheckboxChoiceOptions[] {
    return [
        {
            name: ' 🚀 Native addon (better performance)',
            short: 'Native addon',
            value: MtcuteFeature.NativeAddon,
            checked: true,
        },
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
            name: ' 🐳 Generate Dockerfile',
            short: 'Dockerfile',
            value: MtcuteFeature.Docker,
            checked: true,
        },
        {
            name: ' ✨ Use TypeScript',
            short: 'TypeScript',
            value: MtcuteFeature.TypeScript,
            checked: true,
        },
        {
            name: ' 🥰 Setup Prettier & ESLint',
            short: 'Linters',
            value: MtcuteFeature.Linters,
            checked: true,
        },
    ]
}
