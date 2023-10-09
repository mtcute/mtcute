const path = require('path')

const packagesDir = path.join(__dirname, 'packages')
const eslintCiConfig = path.join(__dirname, '.eslintrc.ci.js')

module.exports = {
    '*.{js,jsx,ts,tsx}': (filenames) => {
        const modifiedPackages = new Set()

        for (const filename of filenames) {
            if (!filename.startsWith(packagesDir)) continue
            modifiedPackages.add(filename.slice(packagesDir.length + 1).split(path.sep)[0])
        }

        return [
            `prettier --write ${filenames.join(' ')}`,
            `eslint -c ${eslintCiConfig} --fix ${filenames.join(' ')}`,
            'pnpm run lint:dpdm',
            ...[...modifiedPackages].map((pkg) => `pnpm -C packages/${pkg} run --if-present build --noEmit`)
        ]
    }
}
