import type { UserConfig } from './cli.js'
import type { MtcuteFeature } from './features/types.js'

import { promises as fs } from 'node:fs'
import * as path from 'node:path'

import * as glob from 'glob'
import Handlebars from 'handlebars'
import { getPackageManagerVersion, packageManagerToRuntime } from './package-manager.js'

const templater = Handlebars.create()

const NOEMIT_HEADER = '/* DO NOT EMIT */'
templater.registerHelper({
    emit_if: cond => (cond ? '' : NOEMIT_HEADER),
    emit_unless: cond => (cond ? NOEMIT_HEADER : ''),
    eq: (v1, v2) => v1 === v2,
    ne: (v1, v2) => v1 !== v2,
    lt: (v1, v2) => v1 < v2,
    gt: (v1, v2) => v1 > v2,
    lte: (v1, v2) => v1 <= v2,
    gte: (v1, v2) => v1 >= v2,
    not: v => !v,
    and(...args) {
        return Array.prototype.every.call(args, Boolean)
    },
    or(...args) {
        return Array.prototype.slice.call(args, 0, -1).some(Boolean)
    },
})

export async function runTemplaterForFile(file: string, config: UserConfig): Promise<string | null> {
    const content = await fs.readFile(file, 'utf-8')

    const execute = templater.compile(content, {
        strict: true,
        noEscape: true,
    })

    const result = execute({
        ...config,
        runtime: packageManagerToRuntime(config.packageManager),
        packageManagerVersion: getPackageManagerVersion()?.join('@'),
        features: config.features.reduce<Record<MtcuteFeature, boolean>>(
            (acc, f) => {
                acc[f] = true

                return acc
            },
            {} as Record<MtcuteFeature, boolean>,
        ),
    })

    if (result.startsWith(NOEMIT_HEADER)) return null

    return result
}

export async function runTemplater(templateDir: string, outDir: string, config: UserConfig): Promise<void> {
    for await (const file of glob.globIterate('**/*', { cwd: templateDir, nodir: true, dot: true })) {
        const sourceFile = path.join(templateDir, file)
        const destFile = path.join(outDir, file.replace(/\.hbs$/, ''))

        const isTemplate = path.extname(file) === '.hbs'

        if (!isTemplate) {
            await fs.mkdir(path.dirname(destFile), { recursive: true })
            await fs.copyFile(sourceFile, destFile)
            continue
        }

        const result = await runTemplaterForFile(sourceFile, config)
        if (result === null) continue

        await fs.mkdir(path.dirname(destFile), { recursive: true })
        await fs.writeFile(destFile, result.trimStart())
    }
}
