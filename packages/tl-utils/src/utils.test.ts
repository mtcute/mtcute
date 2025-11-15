import { describe, expect, it } from 'vitest'

import {
  groupTlEntriesByNamespace,
  parseArgumentType,
  parseTdlibStyleComment,
  splitNameToNamespace,
  stringifyArgumentType,
} from './utils.js'

describe('splitNameToNamespace', () => {
  it('should split names correctly', () => {
    expect(splitNameToNamespace('foo.bar')).toEqual(['foo', 'bar'])
  })

  it('should return null for namespace if there is none', () => {
    expect(splitNameToNamespace('foo')).toEqual([null, 'foo'])
  })
})

describe('parseTdlibStyleComment', () => {
  it('should parse comments correctly', () => {
    expect(parseTdlibStyleComment('@foo Foo description @bar Bar description')).toEqual({
      foo: 'Foo description',
      bar: 'Bar description',
    })
  })
})

describe('groupTlEntriesByNamespace', () => {
  it('should group entries correctly', () => {
    expect(
      groupTlEntriesByNamespace([
        {
          kind: 'class',
          id: 0,
          name: 'foo.bar',
          type: 'FooBar',
          arguments: [],
        },
        {
          kind: 'class',
          id: 0,
          name: 'foo.baz',
          type: 'FooBaz',
          arguments: [],
        },
        {
          kind: 'class',
          id: 0,
          name: 'bar',
          type: 'Bar',
          arguments: [],
        },
      ]),
    ).toMatchSnapshot()
  })
})

describe('stringifyArgumentType', () => {
  it('should keep type as is if there are no modifiers', () => {
    expect(stringifyArgumentType('Foo')).toEqual('Foo')
  })

  it('should stringify bare types', () => {
    expect(stringifyArgumentType('Foo', { isBareUnion: true })).toEqual('%Foo')
    expect(stringifyArgumentType('foo', { isBareType: true })).toEqual('foo')
  })

  it('should stringify vectors', () => {
    expect(stringifyArgumentType('Foo', { isVector: true })).toEqual('Vector<Foo>')
    expect(stringifyArgumentType('Foo', { isVector: true, isBareUnion: true })).toEqual('Vector<%Foo>')
    expect(stringifyArgumentType('Foo', { isBareVector: true })).toEqual('vector<Foo>')
  })

  it('should stringify predicates', () => {
    expect(stringifyArgumentType('Foo', { predicate: 'foo' })).toEqual('foo?Foo')
    expect(stringifyArgumentType('Foo', { predicate: 'foo', isVector: true })).toEqual('foo?Vector<Foo>')
  })
})

describe('parseArgumentType', () => {
  it('should parse bare types', () => {
    expect(parseArgumentType('%Foo')).toEqual(['Foo', { isBareUnion: true }])

    // not enough info to derive that
    expect(parseArgumentType('foo')).toEqual([
      'foo',
      {
        /* isBareType: true */
      },
    ])
  })

  it('should parse vectors', () => {
    expect(parseArgumentType('Vector<Foo>')).toEqual(['Foo', { isVector: true }])
    expect(parseArgumentType('Vector<%Foo>')).toEqual(['Foo', { isVector: true, isBareUnion: true }])
    expect(parseArgumentType('vector<Foo>')).toEqual(['Foo', { isBareVector: true }])
  })

  it('should parse predicates', () => {
    expect(parseArgumentType('foo?Foo')).toEqual(['Foo', { predicate: 'foo' }])
    expect(parseArgumentType('foo?Vector<Foo>')).toEqual(['Foo', { predicate: 'foo', isVector: true }])
  })
})
