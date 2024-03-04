module.exports = ({ path: { join }, fs, outDir, packageDir }) => ({
    esmOnlyDirectives: true,
    final() {
        fs.cpSync(join(packageDir, 'mtcute.wasm'), join(outDir, 'mtcute.wasm'))
    },
})
