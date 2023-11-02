module.exports = ({ fs, path, packageDir, outDir }) => ({
    final() {
        // copy native sources and binding.gyp file

        fs.cpSync(path.join(packageDir, 'lib'), path.join(outDir, 'lib'), { recursive: true })

        const bindingGyp = fs.readFileSync(path.join(packageDir, 'binding.gyp'), 'utf8')
        fs.writeFileSync(
            path.join(outDir, 'binding.gyp'),
            bindingGyp
                // replace paths to crypto
                .replace(/"\.\.\/crypto/g, '"crypto'),
        )

        // for some unknown fucking reason ts doesn't do this
        fs.copyFileSync(path.join(packageDir, 'src/native.cjs'), path.join(outDir, 'cjs/native.cjs'))
        fs.copyFileSync(path.join(packageDir, 'src/native.cjs'), path.join(outDir, 'esm/native.cjs'))
    },
})
