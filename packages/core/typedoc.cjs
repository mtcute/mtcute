module.exports = {
    extends: ['../../typedoc.base.cjs'],
    entryPoints: [
        './src/index.ts',
        './src/utils/index.ts',
        './src/utils/crypto/node-crypto.ts',
        './src/utils/crypto/subtle.ts',
        './src/network/transports/tcp.ts',
        './src/network/transports/websocket.ts',
    ],
    entryPointStrategy: 'expand',
}
