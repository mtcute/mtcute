import Long from 'long'

import { describe, expect, it } from 'vitest'
import { parseUniqueFileId } from './parse-unique.js'
import { tdFileId as td } from './types.js'

describe('parsing unique file ids', () => {
  const test = (uniqueId: string, expected: td.ParsedUniqueFileId) => {
    expect(parseUniqueFileId(uniqueId)).toEqual(expected)
  }

  it('parses unique ids for documents', () => {
    test('AgADegAD997LEQ', {
      type: td.UniqueFileIdType.Document,
      id: Long.fromString('1282363671355326586'),
    })
    test('AgADdAwAAueoWEg', {
      type: td.UniqueFileIdType.Document,
      id: Long.fromString('5213102278772264052'),
    })
    test('AgADXFoAAuCjggc', {
      type: td.UniqueFileIdType.Document,
      id: Long.fromString('541175087705905756'),
    })
  })

  it('parses unique ids for photo thumbnails', () => {
    test('AQADdAwAAueoWEhy', {
      type: td.UniqueFileIdType.Photo,
      location: {
        _: 'photoId',
        id: Long.fromString('5213102278772264052'),
        subType: 114,
      },
    })
  })

  it('parses unique ids for profile pictures', () => {
    // big
    test('AQADySHBDgAE_ykFAAE', {
      type: td.UniqueFileIdType.Photo,
      location: {
        _: 'photoVolumeId',
        volumeId: Long.fromString('247538121'),
        localId: 338431,
      },
    })
    // small
    test('AQADySHBDgAE_SkFAAE', {
      type: td.UniqueFileIdType.Photo,
      location: {
        _: 'photoVolumeId',
        volumeId: Long.fromString('247538121'),
        localId: 338429,
      },
    })
  })
})
