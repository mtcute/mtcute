import { MtArgumentError } from '@mtcute/core'

export function parseIpFromBytes(data: Uint8Array): string {
    if (data.length === 4) {
        return `${data[0]}.${data[1]}.${data[2]}.${data[3]}`
    }

    if (data.length === 16) {
        let res = ''

        for (let i = 0; i < 16; i += 2) {
            res += data[i].toString(16).padStart(2, '0')
            res += data[i + 1].toString(16).padStart(2, '0')
            if (i < 14) res += ':'
        }

        return res
    }

    throw new MtArgumentError('Invalid IP address length')
}

export function serializeIpv4ToBytes(ip: string, buf: Uint8Array) {
    const parts = ip.split('.')

    if (parts.length !== 4) {
        throw new MtArgumentError('Invalid IPv4 address')
    }

    buf[0] = Number(parts[0])
    buf[1] = Number(parts[1])
    buf[2] = Number(parts[2])
    buf[3] = Number(parts[3])
}

export function serializeIpv6ToBytes(ip: string, buf: Uint8Array) {
    const parts = ip.split(':')

    if (parts.length !== 8) {
        throw new MtArgumentError('Invalid IPv6 address')
    }

    for (let i = 0; i < 8; i++) {
        const val = parseInt(parts[i], 16)
        buf[i * 2] = val >> 8
        buf[i * 2 + 1] = val & 0xff
    }
}
