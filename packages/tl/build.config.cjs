module.exports = ({ fs, path, outDir, packageDir }) => ({
    buildTs: false,
    buildCjs: false,
    final() {
        // create package by copying all the needed files
        const files = [
            'binary/reader.d.ts',
            'binary/reader.js',
            'binary/rsa-keys.d.ts',
            'binary/rsa-keys.js',
            'binary/writer.d.ts',
            'binary/writer.js',
            'index.d.ts',
            'index.js',
            'raw-errors.json',
            'mtp-schema.json',
            'api-schema.json',
        ]

        fs.mkdirSync(path.join(outDir, 'binary'), { recursive: true })

        for (const f of files) {
            fs.copyFileSync(path.join(packageDir, f), path.join(outDir, f))
        }
    },
})
