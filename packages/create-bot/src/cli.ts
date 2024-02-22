import * as colors from 'colorette'
import inquirer from 'inquirer'
import { open } from 'openurl'

import { readConfig, UserConfigPersisted, writeConfig } from './config.js'
import { TELEGRAM_APPS_PAGE } from './constants.js'
import { getFeatureChoices } from './features/cli.js'
import { MtcuteFeature } from './features/types.js'

interface UserConfigAnswers {
    reuse?: boolean
    apiId?: string
    apiHash?: string
    botToken?: string
    features: MtcuteFeature[]
}

export interface UserConfig extends UserConfigPersisted {
    name: string
    botToken?: string
    features: MtcuteFeature[]
}

export async function askForConfigPersisted(): Promise<UserConfigPersisted> {
    const existing = await readConfig()

    if (existing) {
        const { reuse } = await inquirer.prompt<UserConfigAnswers>([
            {
                type: 'confirm',
                name: 'reuse',
                message: 'Found existing config, do you want to reuse it?',
                default: true,
            },
        ])

        if (reuse) return existing
    }

    const answers = await inquirer.prompt<UserConfigAnswers>([
        {
            type: 'input',
            name: 'apiId',
            message: 'API ID (press Enter to obtain one):',
            validate: (v: string) => {
                if (!v) {
                    setTimeout(() => {
                        try {
                            open(TELEGRAM_APPS_PAGE)
                        } catch (e) {}
                    }, 1000)

                    return [
                        colors.italic(`Opening ${colors.blue(TELEGRAM_APPS_PAGE)}...`),
                        `🔒 Log in with your ${colors.blueBright('Telegram')} account`,
                        '📝 Fill out the form:',
                        `   - ${colors.bold('App title, short name')}: anything you want, can be changed later`,
                        `   - ${colors.bold('Platform')}: doesn't matter`,
                        `   - ${colors.bold('URL')}: can be left blank`,
                        `🚀 Click ${colors.bold('Create application')}`,
                        `${colors.bold(
                            colors.red('❗ DO NOT'),
                        )} share your API hash with anyone, as it can't be revoked`,
                    ].join('\n')
                }
                if (!/^\d+$/.test(v)) return 'API ID must be a number'

                return true
            },
        },
        {
            type: 'input',
            name: 'apiHash',
            message: 'API hash:',
            validate: (v: string) => {
                if (!v) return 'API hash is required'
                if (!v.match(/^[a-f0-9]{32}$/i)) return 'API hash must be 32 hex characters'

                return true
            },
        },
        {
            type: 'confirm',
            name: 'reuse',
            message: 'Do you want to save these credentials for later use?',
            default: true,
        },
    ])

    const config: UserConfigPersisted = {
        apiId: Number(answers.apiId),
        apiHash: answers.apiHash!,
    }

    if (answers.reuse) {
        await writeConfig(config)
    }

    return config
}

export async function askForConfig(): Promise<UserConfig> {
    const persisted = await askForConfigPersisted()

    let allowEmptyBotToken = false
    const { botToken, features } = await inquirer.prompt<UserConfigAnswers>([
        {
            type: 'input',
            name: 'botToken',
            message: 'Bot token (optional):',
            validate: (v: string) => {
                if (!v) {
                    if (allowEmptyBotToken) return true

                    allowEmptyBotToken = true

                    return [
                        `You most likely need a bot token. You can obtain one from ${colors.blue('@BotFather')}`,
                        `   Press ${colors.bold('Enter')} again if you want to create a ${colors.magenta('userbot')}`,
                    ].join('\n')
                }
                if (!v.match(/^(\d+):[a-z0-9-_]{16,50}$/i)) return 'Invalid bot token'

                return true
            },
        },
        {
            type: 'checkbox',
            choices: getFeatureChoices(),
            name: 'features',
            message: 'Select features:',
        },
    ])

    return {
        ...persisted,
        name: '', // will be filled later
        botToken: botToken || undefined,
        features,
    }
}
