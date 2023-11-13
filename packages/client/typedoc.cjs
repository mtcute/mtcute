module.exports = {
    extends: ['../../.config/typedoc/config.base.cjs'],
    entryPoints: [
        './src/index.ts',
        './src/utils/index.ts',
        './src/methods/updates/index.ts',
    ],
    entryPointStrategy: 'expand',
}
