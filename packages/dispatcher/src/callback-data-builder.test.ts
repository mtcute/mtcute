import type { UpdateFilter } from './filters/index.js'
import { CallbackQuery, MtArgumentError, PeersIndex } from '@mtcute/core'
import { createStub } from '@mtcute/test'

import { describe, expect, it } from 'vitest'
import { CallbackDataBuilder } from './callback-data-builder.js'

describe('CallbackDataBuilder', () => {
  it('should correctly build data', () => {
    const cdb = new CallbackDataBuilder('prefix', 'foo', 'bar')

    expect(cdb.build({ foo: 'foo', bar: 'bar' })).toEqual('prefix:foo:bar')
  })

  it('should correctly throw on invalid data when building', () => {
    const cdb = new CallbackDataBuilder('prefix', 'foo', 'bar')

    expect(() => cdb.build({ foo: 'foo:1', bar: 'bar' })).toThrow(MtArgumentError)
  })

  it('should correctly throw on too long data when building', () => {
    const cdb = new CallbackDataBuilder('prefix', 'foo', 'bar')

    expect(() =>
      cdb.build({
        foo: 'foooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo',
        bar: 'bar',
      }),
    ).toThrow(MtArgumentError)
  })

  it('should correctly parse data', () => {
    const cdb = new CallbackDataBuilder('prefix', 'foo', 'bar')

    expect(cdb.parse('prefix:foo:bar')).toEqual({ foo: 'foo', bar: 'bar' })
  })

  it('should throw on invalid prefix when parsing', () => {
    const cdb = new CallbackDataBuilder('prefix', 'foo', 'bar')

    expect(() => cdb.parse('123:foo:bar')).toThrow(MtArgumentError)
  })

  it('should throw on invalid parts count when parsing', () => {
    const cdb = new CallbackDataBuilder('prefix', 'foo', 'bar')

    expect(() => cdb.parse('prefix:foo:bar:baz')).toThrow(MtArgumentError)
  })

  describe('filter', () => {
    const createCb = (data: string) =>
      new CallbackQuery(
        createStub('updateBotCallbackQuery', {
          data: new TextEncoder().encode(data),
        }),
        new PeersIndex(),
      )

    const getFilterMatch = async (filter: UpdateFilter<CallbackQuery>, data: string) => {
      const cb = createCb(data)

      const matched = await filter(cb)
      if (!matched) return null

      // eslint-disable-next-line
            return (cb as any).match
    }

    it('should create a filter without params', async () => {
      const cdb = new CallbackDataBuilder('prefix', 'foo', 'bar')

      expect(await getFilterMatch(cdb.filter(), 'prefix:foo:bar')).toEqual({
        foo: 'foo',
        bar: 'bar',
      })
      expect(await getFilterMatch(cdb.filter(), 'prefix:foo:bar:baz')).toEqual(null)
    })

    it('should create a filter with params', async () => {
      const cdb = new CallbackDataBuilder('prefix', 'foo', 'bar')

      expect(await getFilterMatch(cdb.filter({ foo: 'foo' }), 'prefix:foo:bar')).toEqual({
        foo: 'foo',
        bar: 'bar',
      })
      expect(await getFilterMatch(cdb.filter({ foo: 'foo' }), 'prefix:bar:bar')).toEqual(null)
    })

    it('should create a filter with regex params', async () => {
      const cdb = new CallbackDataBuilder('prefix', 'foo', 'bar')

      expect(await getFilterMatch(cdb.filter({ foo: /\d+/ }), 'prefix:123:bar')).toEqual({
        foo: '123',
        bar: 'bar',
      })
      expect(await getFilterMatch(cdb.filter({ foo: /\d+/ }), 'prefix:bar:bar')).toEqual(null)
    })

    it('should create a filter with dynamic params', async () => {
      const cdb = new CallbackDataBuilder('prefix', 'foo', 'bar')

      expect(
        await getFilterMatch(
          cdb.filter(() => ({ foo: 'foo' })),
          'prefix:foo:bar',
        ),
      ).toEqual({
        foo: 'foo',
        bar: 'bar',
      })
      expect(
        await getFilterMatch(
          cdb.filter(() => ({ foo: 'foo' })),
          'prefix:bar:baz',
        ),
      ).toEqual(null)
    })

    it('should create a filter with a predicate matcher', async () => {
      const cdb = new CallbackDataBuilder('prefix', 'foo', 'bar')

      expect(
        await getFilterMatch(
          cdb.filter((_, data) => data.foo === 'foo'),
          'prefix:foo:bar',
        ),
      ).toEqual({
        foo: 'foo',
        bar: 'bar',
      })
      expect(
        await getFilterMatch(
          cdb.filter((_, data) => data.foo === 'foo'),
          'prefix:bar:baz',
        ),
      ).toEqual(null)
    })

    it('should not throw on invalid data', async () => {
      const cdb = new CallbackDataBuilder('prefix', 'foo', 'bar')

      await expect(getFilterMatch(cdb.filter(), 'wrong-prefix:foo:bar')).resolves.toEqual(null)
      await expect(getFilterMatch(cdb.filter(), 'prefix:foo:bar:baz')).resolves.toEqual(null)
    })
  })
})
