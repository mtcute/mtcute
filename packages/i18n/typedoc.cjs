module.exports = {
    extends: ['../../.config/typedoc/config.base.cjs'],
    entryPoints: [
        './src/index.ts',
        './src/plurals/*.ts',
    ],
}
