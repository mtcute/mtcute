module.exports = {
    extends: ['../../.config/typedoc/config.base.cjs'],
    entryPoints: [
        './src/index.ts',
        './src/utils/index.ts',
        './src/highlevel/client.ts',
        './src/highlevel/worker/index.ts',
        './src/highlevel/methods.ts',
        './src/platform.ts',
    ],
    entryPointStrategy: 'expand',
}
