module.exports = {
    extends: ['../../.config/typedoc/config.base.cjs'],
    entryPoints: [
        './src/index.ts',
        './src/utils/index.ts',
        './src/utils/crypto/node.ts',
        './src/utils/crypto/web.ts',
        './src/network/transports/tcp.ts',
        './src/network/transports/websocket.ts',
    ],
    entryPointStrategy: 'expand',
}
