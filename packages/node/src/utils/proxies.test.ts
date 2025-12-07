import type { BasicDcOption } from '@mtcute/core/utils.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@fuman/node', () => ({
  connectTcp: vi.fn(),
  connectTls: vi.fn(),
}))

vi.mock('@fuman/net', () => ({
  performHttpProxyHandshake: vi.fn(),
  performSocksHandshake: vi.fn(),
}))

describe('proxies', () => {
  let connectTcp: any
  let connectTls: any
  let performHttpProxyHandshake: any
  let performSocksHandshake: any

  beforeEach(async () => {
    vi.resetModules()
    const fumanNode = await import('@fuman/node')
    const fumanNet = await import('@fuman/net')

    connectTcp = fumanNode.connectTcp
    connectTls = fumanNode.connectTls
    performHttpProxyHandshake = fumanNet.performHttpProxyHandshake
    performSocksHandshake = fumanNet.performSocksHandshake

    vi.clearAllMocks()
  })

  describe('HttpProxyTcpTransport', () => {
    it('should connect via HTTP proxy', async () => {
      const { HttpProxyTcpTransport } = await import('./proxies.js')

      const mockConn = { write: vi.fn(), read: vi.fn() }
      connectTcp.mockResolvedValue(mockConn)

      const transport = new HttpProxyTcpTransport({
        host: 'proxy.example.com',
        port: 8080,
      })

      const dc: BasicDcOption = {
        id: 1,
        ipAddress: '149.154.167.50',
        port: 443,
      }

      const conn = await transport.connect(dc)

      expect(connectTcp).toHaveBeenCalledWith({
        address: 'proxy.example.com',
        port: 8080,
      })

      expect(performHttpProxyHandshake).toHaveBeenCalledWith(
        mockConn,
        mockConn,
        expect.objectContaining({
          host: 'proxy.example.com',
          port: 8080,
        }),
        {
          address: '149.154.167.50',
          port: 443,
        },
      )

      expect(conn).toBe(mockConn)
    })

    it('should connect via HTTPS proxy', async () => {
      const { HttpProxyTcpTransport } = await import('./proxies.js')

      const mockConn = { write: vi.fn(), read: vi.fn() }
      connectTls.mockResolvedValue(mockConn)

      const transport = new HttpProxyTcpTransport({
        host: 'proxy.example.com',
        port: 8443,
        tls: true,
        tlsOptions: {},
      })

      const dc: BasicDcOption = {
        id: 1,
        ipAddress: '149.154.167.50',
        port: 443,
      }

      await transport.connect(dc)

      expect(connectTls).toHaveBeenCalledWith({
        address: 'proxy.example.com',
        port: 8443,
        extraOptions: {},
      })

      expect(connectTcp).not.toHaveBeenCalled()
    })

    it('should return IntermediatePacketCodec', async () => {
      const { HttpProxyTcpTransport } = await import('./proxies.js')
      const { IntermediatePacketCodec } = await import('@mtcute/core')

      const transport = new HttpProxyTcpTransport({
        host: 'proxy.example.com',
        port: 8080,
      })

      const codec = transport.packetCodec()
      expect(codec).toBeInstanceOf(IntermediatePacketCodec)
    })
  })

  describe('SocksProxyTcpTransport', () => {
    it('should connect via SOCKS proxy', async () => {
      const { SocksProxyTcpTransport } = await import('./proxies.js')

      const mockConn = { write: vi.fn(), read: vi.fn() }
      connectTcp.mockResolvedValue(mockConn)

      const transport = new SocksProxyTcpTransport({
        host: 'socks.example.com',
        port: 1080,
        version: 5,
      })

      const dc: BasicDcOption = {
        id: 1,
        ipAddress: '149.154.167.50',
        port: 443,
      }

      const conn = await transport.connect(dc)

      expect(connectTcp).toHaveBeenCalledWith({
        address: 'socks.example.com',
        port: 1080,
      })

      expect(performSocksHandshake).toHaveBeenCalledWith(
        mockConn,
        mockConn,
        expect.objectContaining({
          host: 'socks.example.com',
          port: 1080,
          version: 5,
        }),
        {
          address: '149.154.167.50',
          port: 443,
        },
      )

      expect(conn).toBe(mockConn)
    })

    it('should return IntermediatePacketCodec', async () => {
      const { SocksProxyTcpTransport } = await import('./proxies.js')
      const { IntermediatePacketCodec } = await import('@mtcute/core')

      const transport = new SocksProxyTcpTransport({
        host: 'socks.example.com',
        port: 1080,
        version: 5,
      })

      const codec = transport.packetCodec()
      expect(codec).toBeInstanceOf(IntermediatePacketCodec)
    })
  })

  describe('MtProxyTcpTransport', () => {
    it('should connect via TCP', async () => {
      const { MtProxyTcpTransport } = await import('./proxies.js')

      const mockConn = { write: vi.fn(), read: vi.fn() }
      connectTcp.mockResolvedValue(mockConn)

      const transport = new MtProxyTcpTransport({
        host: 'mtproxy.example.com',
        port: 443,
        secret: new Uint8Array(16),
      })

      const conn = await transport._connectTcp({
        address: 'mtproxy.example.com',
        port: 443,
      })

      expect(connectTcp).toHaveBeenCalledWith({
        address: 'mtproxy.example.com',
        port: 443,
      })

      expect(conn).toBe(mockConn)
    })
  })
})
