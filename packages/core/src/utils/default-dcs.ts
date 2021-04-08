import { tl } from '@mtcute/tl'

export const defaultProductionDc: tl.RawDcOption = {
    _: 'dcOption',
    ipAddress: '149.154.167.50',
    port: 443,
    id: 2,
}

export const defaultProductionIpv6Dc: tl.RawDcOption = {
    _: 'dcOption',
    ipAddress: '2001:67c:4e8:f002::a',
    ipv6: true,
    port: 443,
    id: 2,
}

export const defaultTestDc: tl.RawDcOption = {
    _: 'dcOption',
    ipAddress: '149.154.167.40',
    port: 443,
    id: 2,
}

export const defaultTestIpv6Dc: tl.RawDcOption = {
    _: 'dcOption',
    ipAddress: '2001:67c:4e8:f002::e',
    port: 443,
    ipv6: true,
    id: 2,
}

export const defaultDcs = {
    defaultTestDc,
    defaultTestIpv6Dc,
    defaultProductionDc,
    defaultProductionIpv6Dc,
} as const
