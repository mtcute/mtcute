module.exports = ({ outDir, fs, jsr }) => ({
    buildCjs: false,
    final() {
        if (jsr) {
            // jsr doesn't support symlinks, so we need to copy the files manually
            const real = fs.realpathSync(`${outDir}/common-internals-web`)
            fs.unlinkSync(`${outDir}/common-internals-web`)
            // console.log(real)
            fs.cpSync(real, `${outDir}/common-internals-web`, { recursive: true })
        }
    },
})
