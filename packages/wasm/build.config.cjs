module.exports = ({ path: { join }, fs, outDir, packageDir }) => ({
    esmOnlyDirectives: true,
    final() {
        fs.cpSync(join(packageDir, 'lib/mtcute.wasm'), join(outDir, 'mtcute.wasm'))
    },
})
