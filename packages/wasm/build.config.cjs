module.exports = ({ path: { join }, fs, outDir, packageDir, jsr, transformFile }) => ({
    esmOnlyDirectives: true,
    final() {
        fs.cpSync(join(packageDir, 'mtcute.wasm'), join(outDir, 'mtcute.wasm'))

        if (jsr) {
            transformFile(join(outDir, 'index.ts'), code => code.replace("'../mtcute.wasm'", "'./mtcute.wasm'"))
        }
    },
})
