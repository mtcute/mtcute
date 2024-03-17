export enum PackageManager {
    Npm = 'npm',
    Yarn = 'yarn',
    Pnpm = 'pnpm',
    Bun = 'bun',
}

export function getPackageManager(): PackageManager {
    const userAgent = process.env.npm_config_user_agent

    if (!userAgent) {
        return PackageManager.Pnpm // fall back to the most based one
    }

    const name = userAgent.split('/')[0]

    switch (name) {
        case 'pnpm':
            return PackageManager.Pnpm
        case 'yarn':
            return PackageManager.Yarn
        case 'npm':
            return PackageManager.Npm
        case 'bun':
            return PackageManager.Bun
        default:
            throw new Error(`Unsupported package manager: ${name}`)
    }
}

export function getInstallCommand(params: { mgr: PackageManager; packages: string[]; dev?: boolean }): string[] {
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

export function getExecCommand(mgr: PackageManager, ...cmd: string[]) {
    switch (mgr) {
        case PackageManager.Npm:
            return ['npx', ...cmd]
        case PackageManager.Yarn:
            return ['yarn', ...cmd]
        case PackageManager.Pnpm:
            return ['pnpm', 'exec', ...cmd]
        case PackageManager.Bun:
            return ['bun', 'run', ...cmd]
    }
}
