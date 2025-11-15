import { TlBinaryReader, TlBinaryWriter } from '@mtcute/tl-runtime'

export interface BasicDcOption {
  ipAddress: string
  port: number
  id: number
  ipv6?: boolean
  mediaOnly?: boolean
  testMode?: boolean
}

export function serializeBasicDcOption(dc: BasicDcOption): Uint8Array {
  const writer = TlBinaryWriter.manual(64)

  const flags = (dc.ipv6 ? 1 : 0)
    | (dc.mediaOnly ? 2 : 0)
    | (dc.testMode ? 4 : 0)
  writer.raw(
    new Uint8Array([
      2, // version
      dc.id,
      flags,
    ]),
  )

  writer.string(dc.ipAddress)
  writer.int(dc.port)

  return writer.result()
}

export function parseBasicDcOption(data: Uint8Array): BasicDcOption | null {
  const reader = TlBinaryReader.manual(data)

  const [version, id, flags] = reader.raw(3)
  if (version !== 1 && version !== 2) return null

  const ipAddress = reader.string()
  const port = reader.int()

  return {
    id,
    ipAddress,
    port,
    ipv6: (flags & 1) !== 0,
    mediaOnly: (flags & 2) !== 0,
    testMode: version === 2 && (flags & 4) !== 0,
  }
}

export interface DcOptions {
  main: BasicDcOption
  media: BasicDcOption
}

export const defaultProductionDc: DcOptions = {
  main: {
    ipAddress: '149.154.167.50',
    port: 443,
    id: 2,
  },
  media: {
    ipAddress: '149.154.167.222',
    port: 443,
    id: 2,
    mediaOnly: true,
  },
}

export const defaultProductionIpv6Dc: DcOptions = {
  main: {
    ipAddress: '2001:067c:04e8:f002:0000:0000:0000:000a',
    ipv6: true,
    port: 443,
    id: 2,
  },
  media: {
    ipAddress: '2001:067c:04e8:f002:0000:0000:0000:000b',
    ipv6: true,
    port: 443,
    id: 2,
    mediaOnly: true,
  },
}

export const defaultTestDc: DcOptions = {
  main: {
    ipAddress: '149.154.167.40',
    port: 443,
    id: 2,
    testMode: true,
  },
  media: {
    ipAddress: '149.154.167.40',
    port: 443,
    id: 2,
    mediaOnly: true,
    testMode: true,
  },
}

export const defaultTestIpv6Dc: DcOptions = {
  main: {
    ipAddress: '2001:67c:4e8:f002::e',
    port: 443,
    ipv6: true,
    id: 2,
    testMode: true,
  },
  media: {
    ipAddress: '2001:67c:4e8:f002::e',
    port: 443,
    ipv6: true,
    id: 2,
    mediaOnly: true,
    testMode: true,
  },
}
