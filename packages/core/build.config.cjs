module.exports = ({ path, transformFile, packageDir, outDir }) => ({
    esmOnlyDirectives: true,
    final() {
        const version = require(path.join(packageDir, 'package.json')).version
        const replaceVersion = (content) => content.replace('%VERSION%', version)

        transformFile(path.join(outDir, 'cjs/network/network-manager.js'), replaceVersion)
        transformFile(path.join(outDir, 'esm/network/network-manager.js'), replaceVersion)
    },
})
