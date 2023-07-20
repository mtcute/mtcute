const path = require('path')

const packagesDir = path.join(__dirname, 'packages')

module.exports = {
    '*.{js,jsx,ts,tsx}': (filenames) => {
        const modifiedPackages = new Set()

        for (const filename of filenames) {
            if (!filename.startsWith(packagesDir)) continue
            modifiedPackages.add(filename.slice(packagesDir.length + 1).split(path.sep)[0])
        }

        return [
            `prettier --write ${filenames.join(' ')}`,
            `eslint --fix ${filenames.join(' ')}`,
            ...[...modifiedPackages].map((pkg) => `pnpm -C packages/${pkg} run --if-present build --noEmit`)
        ]
    }
}
