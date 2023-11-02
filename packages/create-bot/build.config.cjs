module.exports = ({ fs, path, packageDir, outDir }) => ({
    buildCjs: false,
    final() {
        fs.cpSync(path.join(packageDir, 'template'), path.join(outDir, 'template'), { recursive: true })
    },
})
