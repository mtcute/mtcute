import type { TelegramTransport } from './abstract.js'

import { describe, expect, it, vi } from 'vitest'
import { MtArgumentError } from '../../types/errors.js'
import { createProxyTransportFactory } from './proxy.js'

/* eslint-disable ts/no-unsafe-assignment */

function makeMockTransport(name: string) {
  return vi.fn().mockImplementation(function (this: any, opts: any) {
    this._name = name
    this._opts = opts
  }) as unknown as new (opts: any) => TelegramTransport
}

describe('createProxyTransportFactory', () => {
  describe('socks', () => {
    it('should parse socks5 url', () => {
      const Socks = makeMockTransport('socks')
      const factory = createProxyTransportFactory({ SocksProxyTcpTransport: Socks })

      const transport = factory('socks5://user:pass@127.0.0.1:1080') as any
      expect(Socks).toHaveBeenCalledWith({
        version: 5,
        host: '127.0.0.1',
        port: 1080,
        user: 'user',
        password: 'pass',
      })
      expect(transport._name).toBe('socks')
    })

    it('should parse socks4 url', () => {
      const Socks = makeMockTransport('socks')
      const factory = createProxyTransportFactory({ SocksProxyTcpTransport: Socks })

      factory('socks4://127.0.0.1:1080')
      expect(Socks).toHaveBeenCalledWith({
        version: 4,
        host: '127.0.0.1',
        port: 1080,
        user: '',
        password: '',
      })
    })

    it('should default to port 1080 when no port specified', () => {
      const Socks = makeMockTransport('socks')
      const factory = createProxyTransportFactory({ SocksProxyTcpTransport: Socks })

      factory('socks5://127.0.0.1')
      expect(Socks).toHaveBeenCalledWith(expect.objectContaining({
        port: 1080,
      }))
    })

    it('should pass empty credentials when none provided', () => {
      const Socks = makeMockTransport('socks')
      const factory = createProxyTransportFactory({ SocksProxyTcpTransport: Socks })

      factory('socks5://127.0.0.1:1080')
      expect(Socks).toHaveBeenCalledWith(expect.objectContaining({
        user: '',
        password: '',
      }))
    })

    it('should prefer socks over http for socks urls', () => {
      const Socks = makeMockTransport('socks')
      const Http = makeMockTransport('http')
      const factory = createProxyTransportFactory({
        SocksProxyTcpTransport: Socks,
        HttpProxyTcpTransport: Http,
      })

      factory('socks5://127.0.0.1:1080')
      expect(Socks).toHaveBeenCalled()
      expect(Http).not.toHaveBeenCalled()
    })

    it('should throw for socks5 when SocksProxyTcpTransport not provided', () => {
      const Http = makeMockTransport('http')
      const factory = createProxyTransportFactory({ HttpProxyTcpTransport: Http })
      expect(() => factory('socks5://127.0.0.1:1080')).toThrow(MtArgumentError)
    })

    it('should throw for socks4 when SocksProxyTcpTransport not provided', () => {
      const Http = makeMockTransport('http')
      const factory = createProxyTransportFactory({ HttpProxyTcpTransport: Http })
      expect(() => factory('socks4://127.0.0.1:1080')).toThrow(MtArgumentError)
    })
  })

  describe('http', () => {
    it('should parse http proxy url', () => {
      const Http = makeMockTransport('http')
      const factory = createProxyTransportFactory({ HttpProxyTcpTransport: Http })

      factory('http://user:pass@proxy.example.com:8080')
      expect(Http).toHaveBeenCalledWith({
        tls: false,
        host: 'proxy.example.com',
        port: 8080,
        user: 'user',
        password: 'pass',
      })
    })

    it('should parse https proxy url', () => {
      const Http = makeMockTransport('http')
      const factory = createProxyTransportFactory({ HttpProxyTcpTransport: Http })

      factory('https://proxy.example.com:443')
      expect(Http).toHaveBeenCalledWith({
        tls: true,
        host: 'proxy.example.com',
        port: 443,
        user: '',
        password: '',
      })
    })

    it('should default to port 80 for http', () => {
      const Http = makeMockTransport('http')
      const factory = createProxyTransportFactory({ HttpProxyTcpTransport: Http })

      factory('http://proxy.example.com')
      expect(Http).toHaveBeenCalledWith(expect.objectContaining({
        tls: false,
        port: 80,
      }))
    })

    it('should default to port 443 for https', () => {
      const Http = makeMockTransport('http')
      const factory = createProxyTransportFactory({ HttpProxyTcpTransport: Http })

      factory('https://proxy.example.com')
      expect(Http).toHaveBeenCalledWith(expect.objectContaining({
        tls: true,
        port: 443,
      }))
    })

    it('should pass empty credentials when none provided', () => {
      const Http = makeMockTransport('http')
      const factory = createProxyTransportFactory({ HttpProxyTcpTransport: Http })

      factory('http://proxy.example.com:8080')
      expect(Http).toHaveBeenCalledWith(expect.objectContaining({
        user: '',
        password: '',
      }))
    })

    it('should throw when HttpProxyTcpTransport not provided', () => {
      const factory = createProxyTransportFactory({})
      expect(() => factory('http://example.com:8080')).toThrow(MtArgumentError)
    })
  })

  describe('mtproxy', () => {
    it('should parse t.me/proxy link', () => {
      const MtProxy = makeMockTransport('mtproxy')
      const factory = createProxyTransportFactory({ MtProxyTcpTransport: MtProxy })

      factory('https://t.me/proxy?server=server&port=123&secret=secret')
      expect(MtProxy).toHaveBeenCalledWith({
        host: 'server',
        port: 123,
        secret: 'secret',
      })
    })

    it('should parse tg://proxy link', () => {
      const MtProxy = makeMockTransport('mtproxy')
      const factory = createProxyTransportFactory({ MtProxyTcpTransport: MtProxy })

      factory('tg://proxy?server=1.2.3.4&port=443&secret=abc')
      expect(MtProxy).toHaveBeenCalledWith({
        host: '1.2.3.4',
        port: 443,
        secret: 'abc',
      })
    })

    it('should throw when MtProxyTcpTransport not provided', () => {
      const factory = createProxyTransportFactory({})
      expect(() => factory('tg://proxy?server=server&port=123&secret=secret')).toThrow(MtArgumentError)
    })
  })

  describe('unsupported', () => {
    it('should throw for unsupported protocol', () => {
      const factory = createProxyTransportFactory({})
      expect(() => factory('ftp://example.com')).toThrow(MtArgumentError)
    })
  })
})
