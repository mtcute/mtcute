module.exports = {
    cjs: {
        getFiles: () => 'tests/**/*.js',
        runFile: (file) => `mocha ${file}`,
    },
    esm: {
        getFiles: () => 'tests/**/*.js',
        runFile: (file) => `mocha ${file}`,
    },
    ts: {
        getFiles: () => 'tests/**/*.ts',
        beforeAll: () => ['tsc', 'node build-esm.cjs'],
        runFile: (file) => {
            if (file.startsWith('tests/packaging/')) {
                // packaging tests - we need to make sure everything imports and works
                return [
                    `mocha -r ts-node/register ${file}`,
                    `mocha dist/${file.replace(/\.ts$/, '.js')}`,
                    `node run-esm.cjs ${file}`,
                    `mocha dist/esm/${file.replace(/\.ts$/, '.js')}`,
                ]
            }

            // normal e2e tests - testing features etc
            return `mocha dist/${file.replace(/\.ts$/, '.js')}`
        },
    },
}
