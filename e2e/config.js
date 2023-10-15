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
        beforeAll: () => [
            'tsc',
            'node build-esm.cjs',
        ],
        runFile: (file) => [
            `mocha -r ts-node/register ${file}`,
            `mocha dist/${file.replace(/\.ts$/, '.js')}`,
            `node run-esm.cjs ${file}`,
            `mocha dist/esm/${file.replace(/\.ts$/, '.js')}`,
        ],
    },
}
