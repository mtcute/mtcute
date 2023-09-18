import { ITelegramStorage } from '../storage'

/** @internal */
export const defaultProductionDc: ITelegramStorage.DcOptions = {
    main: {
        _: 'dcOption',
        ipAddress: '149.154.167.50',
        port: 443,
        id: 2,
    },
    media: {
        _: 'dcOption',
        ipAddress: '149.154.167.222',
        port: 443,
        id: 2,
        mediaOnly: true,
    },
}

/** @internal */
export const defaultProductionIpv6Dc: ITelegramStorage.DcOptions = {
    main: {
        _: 'dcOption',
        ipAddress: '2001:067c:04e8:f002:0000:0000:0000:000a',
        ipv6: true,
        port: 443,
        id: 2,
    },
    media: {
        _: 'dcOption',
        ipAddress: '2001:067c:04e8:f002:0000:0000:0000:000b',
        ipv6: true,
        mediaOnly: true,
        port: 443,
        id: 2,
    },
}

/** @internal */
export const defaultTestDc: ITelegramStorage.DcOptions = {
    main: {
        _: 'dcOption',
        ipAddress: '149.154.167.40',
        port: 443,
        id: 2,
    },
    media: {
        _: 'dcOption',
        ipAddress: '149.154.167.40',
        port: 443,
        id: 2,
    },
}

/** @internal */
export const defaultTestIpv6Dc: ITelegramStorage.DcOptions = {
    main: {
        _: 'dcOption',
        ipAddress: '2001:67c:4e8:f002::e',
        port: 443,
        ipv6: true,
        id: 2,
    },
    media: {
        _: 'dcOption',
        ipAddress: '2001:67c:4e8:f002::e',
        port: 443,
        ipv6: true,
        id: 2,
    },
}

export const defaultDcs = {
    defaultTestDc,
    defaultTestIpv6Dc,
    defaultProductionDc,
    defaultProductionIpv6Dc,
} as const
