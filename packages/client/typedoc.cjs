module.exports = {
    extends: ['../../typedoc.base.cjs'],
    entryPoints: [
        './src/index.ts',
        './src/utils/index.ts',
    ],
    entryPointStrategy: 'expand',
}
