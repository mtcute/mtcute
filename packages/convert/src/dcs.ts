import type { DcOptions } from '@mtcute/core/utils.js'

// some libraries only store the DCs in the source code, so we need to map them to the correct DCs
// this may not be very accurate, but it's better than nothing
// we *could* always map those to the primary dc (the client should handle that gracefully),
// but imo it's better to be as accurate as possible
// we'll also only map to ipv4 since that's more portable

export const DC_MAPPING_PROD: Record<number, DcOptions> = {
  1: {
    main: {
      id: 1,
      ipAddress: '149.154.175.56',
      port: 443,
    },
    media: {
      id: 1,
      ipAddress: '149.154.175.211',
      port: 443,
    },
  },
  2: {
    main: {
      id: 2,
      ipAddress: '149.154.167.41',
      port: 443,
    },
    media: {
      id: 2,
      ipAddress: '149.154.167.35',
      port: 443,
    },
  },
  3: {
    main: {
      id: 3,
      ipAddress: '149.154.175.100',
      port: 443,
    },
    media: {
      id: 3,
      ipAddress: '149.154.175.100',
      port: 443,
    },
  },
  4: {
    main: {
      id: 4,
      ipAddress: '149.154.167.91',
      port: 443,
    },
    media: {
      id: 4,
      ipAddress: '149.154.167.255',
      port: 443,
    },
  },
  5: {
    main: {
      id: 5,
      ipAddress: '91.108.56.179',
      port: 443,
    },
    media: {
      id: 5,
      ipAddress: '149.154.171.255',
      port: 443,
    },
  },
}

export const DC_MAPPING_TEST: Record<number, DcOptions> = {
  1: {
    main: {
      id: 1,
      ipAddress: '149.154.175.10',
      port: 80,
      testMode: true,
    },
    media: {
      id: 1,
      ipAddress: '149.154.175.10',
      port: 80,
      testMode: true,
    },
  },
  2: {
    main: {
      id: 2,
      ipAddress: '149.154.167.40',
      port: 443,
      testMode: true,
    },
    media: {
      id: 2,
      ipAddress: '149.154.167.40',
      port: 443,
      testMode: true,
    },
  },
  3: {
    main: {
      id: 3,
      ipAddress: '149.154.175.117',
      port: 443,
      testMode: true,
    },
    media: {
      id: 3,
      ipAddress: '149.154.175.117',
      port: 443,
      testMode: true,
    },
  },
}

export function isTestDc(ip: string): boolean {
  return Object.values(DC_MAPPING_TEST).some(dc => dc.main.ipAddress === ip || dc.media.ipAddress === ip)
}
