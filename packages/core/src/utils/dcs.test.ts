import { describe, expect, it } from 'vitest'

import { dedupeDcOptions, getDcOptionAddressKey } from './dcs.js'

describe('getDcOptionAddressKey', () => {
  it('should include the port', () => {
    expect(getDcOptionAddressKey({ id: 2, ipAddress: '149.154.167.51', port: 443 })).toBe('149.154.167.51:443')
  })

  it('should normalize ipv6 addresses', () => {
    const expanded = { id: 2, ipAddress: '2001:067c:04e8:f002:0000:0000:0000:000a', port: 443, ipv6: true }
    const compressed = { id: 2, ipAddress: '2001:67c:4e8:f002::a', port: 443, ipv6: true }

    expect(getDcOptionAddressKey(expanded)).toBe('[2001:67c:4e8:f002::a]:443')
    expect(getDcOptionAddressKey(compressed)).toBe('[2001:67c:4e8:f002::a]:443')
  })
})

describe('dedupeDcOptions', () => {
  it('should keep the first option for each address', () => {
    const a = { id: 5, ipAddress: '91.108.56.177', port: 443 }
    const aStatic = { id: 5, ipAddress: '91.108.56.177', port: 443, mediaOnly: true }
    const b = { id: 5, ipAddress: '149.154.171.5', port: 443 }
    const v6 = { id: 5, ipAddress: '2001:0b28:f23f:f005:0000:0000:0000:000a', port: 443, ipv6: true }
    const v6Short = { id: 5, ipAddress: '2001:b28:f23f:f005::a', port: 443, ipv6: true }

    expect(dedupeDcOptions([a, aStatic, b, v6, v6Short])).toEqual([a, b, v6])
  })
})
