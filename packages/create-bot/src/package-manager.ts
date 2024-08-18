import process from 'node:process'

import * as colors from 'colorette'

export function getPackageManagerVersion(): [string, string] | null {
    if (typeof Deno !== 'undefined') {
        return null
    }

    const userAgent = process.env.npm_config_user_agent

    if (!userAgent) {
        return null
    }

    const software = userAgent.split(' ')[0]
    const manager = software.split('/')[0]
    const version = software.split('/')[1]

    if (!version.match(/^\d+\.\d+\.\d+$/)) {
        return null
    }

    return [manager, version]
}

export enum PackageManager {
    Npm = 'npm',
    Yarn = 'yarn',
    Pnpm = 'pnpm',
    Bun = 'bun',
    Deno = 'deno',
}

export function getPackageManager(): PackageManager {
    const parsed = getPackageManagerVersion()

    if (!parsed) {
        if (typeof Deno !== 'undefined') return PackageManager.Deno

        console.warn(colors.yellow('[warning] could not detect package manager, falling back to pnpm'))

        return PackageManager.Pnpm // fall back to the most based one
    }

    switch (parsed[0]) {
        case 'pnpm':
            return PackageManager.Pnpm
        case 'yarn':
            return PackageManager.Yarn
        case 'npm':
            return PackageManager.Npm
        case 'bun':
            return PackageManager.Bun
        default:
            throw new Error(`Unsupported package manager: ${parsed[0]}`)
    }
}

export function getInstallCommand(params: { mgr: PackageManager, packages: string[], dev?: boolean }): string[] {
    const { mgr, packages, dev } = params

    const exec: string[] = [mgr]

    switch (mgr) {
        case PackageManager.Npm:
            exec.push('install', dev ? '--save-dev' : '--save')
            break
        case PackageManager.Yarn:
            exec.push('add')
            if (dev) exec.push('-D')
            break
        case PackageManager.Pnpm:
            exec.push('add')
            if (dev) exec.push('--save-dev')
            break
        case PackageManager.Bun:
            exec.push('add')
            if (dev) exec.push('-D')
            break
    }

    exec.push(...packages)

    return exec
}

export function getExecCommand(mgr: PackageManager, ...cmd: string[]): string[] {
    switch (mgr) {
        case PackageManager.Npm:
            return ['npx', ...cmd]
        case PackageManager.Yarn:
            return ['yarn', ...cmd]
        case PackageManager.Pnpm:
            return ['pnpm', 'exec', ...cmd]
        case PackageManager.Bun:
            return ['bun', 'run', ...cmd]
        case PackageManager.Deno:
            throw new Error('Deno does not support exec commands')
    }
}

export function packageManagerToRuntime(mgr: PackageManager): 'node' | 'bun' | 'deno' {
    switch (mgr) {
        case PackageManager.Npm:
        case PackageManager.Yarn:
        case PackageManager.Pnpm:
            return 'node'
        case PackageManager.Bun:
            return 'bun'
        case PackageManager.Deno:
            return 'deno'
    }
}
