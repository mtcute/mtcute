import { describe, it } from 'mocha'
import { expect } from 'chai'
import { parseFileId } from '../src/parse'
import { tdFileId as td } from '../src/types'
import bigInt from 'big-integer'

// test file IDs are partially taken from https://github.com/luckydonald/telegram_file_id

describe('parsing file ids', () => {
    const test = (id: string, expected: td.RawFullRemoteFileLocation) => {
        expect(parseFileId(id)).eql(expected)
    }

    it('parses common file ids', () => {
        test(
            'CAACAgIAAxkBAAEJny9gituz1_V_uSKBUuG_nhtzEtFOeQACXFoAAuCjggfYjw_KAAGSnkgfBA',
            {
                _: 'remoteFileLocation',
                dcId: 2,
                fileReference: Buffer.from(
                    '0100099f2f608adbb3d7f57fb9228152e1bf9e1b7312d14e79',
                    'hex'
                ),
                location: {
                    _: 'common',
                    accessHash: bigInt('5232780349138767832'),
                    id: bigInt('541175087705905756'),
                },
                type: td.FileType.Sticker,
            }
        )
        test(
            'BQACAgIAAxkBAAEJnzNgit00IDsKd07OdSeanwz8osecYAACdAwAAueoWEicaPvNdOYEwB8E',
            {
                _: 'remoteFileLocation',
                dcId: 2,
                fileReference: Buffer.from(
                    '0100099f33608add34203b0a774ece75279a9f0cfca2c79c60',
                    'hex'
                ),
                location: {
                    _: 'common',
                    accessHash: bigInt('-4610306729174144868'),
                    id: bigInt('5213102278772264052'),
                },
                type: td.FileType.Document,
            }
        )
    })

    it('parses thumbnails file ids', () => {
        test(
            'AAMCAgADGQEAAQmfL2CK27PX9X-5IoFS4b-eG3MS0U55AAJcWgAC4KOCB9iPD8oAAZKeSK1c8w4ABAEAB20AA1kCAAIfBA',
            {
                _: 'remoteFileLocation',
                dcId: 2,
                fileReference: Buffer.from(
                    '0100099f2f608adbb3d7f57fb9228152e1bf9e1b7312d14e79',
                    'hex'
                ),
                location: {
                    _: 'photo',
                    accessHash: bigInt('5232780349138767832'),
                    id: bigInt('541175087705905756'),
                    localId: 601,
                    source: {
                        _: 'thumbnail',
                        fileType: td.FileType.Thumbnail,
                        thumbnailType: 'm',
                    },
                    volumeId: bigInt('250829997'),
                },
                type: td.FileType.Thumbnail,
            }
        )
    })

    it('parses profile pictures', () => {
        // big
        test('AQADAgATqfDdly4AAwMAA4siCOX_____AAhKowIAAR4E', {
            _: 'remoteFileLocation',
            dcId: 2,
            fileReference: null,
            location: {
                _: 'photo',
                accessHash: bigInt.zero,
                id: bigInt.zero,
                localId: 172874,
                source: {
                    _: 'dialogPhoto',
                    id: bigInt('-452451701'),
                    accessHash: bigInt.zero,
                    big: true,
                },
                volumeId: bigInt('200116400297'),
            },
            type: td.FileType.ProfilePhoto,
        })

        // small
        test('AQADAgATqfDdly4AAwIAA4siCOX_____AAhIowIAAR4E', {
            _: 'remoteFileLocation',
            dcId: 2,
            fileReference: null,
            location: {
                _: 'photo',
                accessHash: bigInt.zero,
                id: bigInt.zero,
                localId: 172872,
                source: {
                    _: 'dialogPhoto',
                    id: bigInt('-452451701'),
                    accessHash: bigInt.zero,
                    big: false,
                },
                volumeId: bigInt('200116400297'),
            },
            type: td.FileType.ProfilePhoto,
        })
    })

    it('parses channel pictures', () => {
        // big
        test('AQADAgATySHBDgAEAwAD0npI3Bb___-wfxjpg7QCPf8pBQABHwQ', {
            _: 'remoteFileLocation',
            dcId: 2,
            fileReference: null,
            location: {
                _: 'photo',
                accessHash: bigInt.zero,
                id: bigInt.zero,
                localId: 338431,
                source: {
                    _: 'dialogPhoto',
                    id: bigInt('-1001326609710'),
                    accessHash: bigInt('4396274664911437744'),
                    big: true,
                },
                volumeId: bigInt('247538121'),
            },
            type: td.FileType.ProfilePhoto,
        })
        // small
        test('AQADAgATySHBDgAEAgAD0npI3Bb___-wfxjpg7QCPf0pBQABHwQ', {
            _: 'remoteFileLocation',
            dcId: 2,
            fileReference: null,
            location: {
                _: 'photo',
                accessHash: bigInt.zero,
                id: bigInt.zero,
                localId: 338429,
                source: {
                    _: 'dialogPhoto',
                    id: bigInt('-1001326609710'),
                    accessHash: bigInt('4396274664911437744'),
                    big: false,
                },
                volumeId: bigInt('247538121'),
            },
            type: td.FileType.ProfilePhoto,
        })
    })

    it('parses older short file ids', () => {
        test('CAADAQADegAD997LEUiQZafDlhIeAg', {
            _: 'remoteFileLocation',
            dcId: 1,
            fileReference: null,
            location: {
                _: 'common',
                accessHash: bigInt('2166960137789870152'),
                id: bigInt('1282363671355326586'),
            },
            type: td.FileType.Sticker,
        })
    })
})
