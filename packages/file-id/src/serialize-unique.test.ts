import { describe, expect, it } from 'vitest'

import { parseFileId } from './parse.js'
import { toUniqueFileId } from './serialize-unique.js'

// test file IDs are partially taken from https://github.com/luckydonald/telegram_file_id

describe('serializing unique file ids', () => {
  const test = (id: string, expected: string) => {
    expect(toUniqueFileId(parseFileId(id))).eql(expected)
  }

  it('serializes unique ids for old file ids', () => {
    test('CAADAQADegAD997LEUiQZafDlhIeAg', 'AgADegAD997LEQ')
  })

  it('serializes unique ids for common file ids', () => {
    test('CAACAgEAAx0CVgtngQACAuFfU1GY9wiRG7A7jlIBbP2yvAostAACegAD997LEUiQZafDlhIeGwQ', 'AgADegAD997LEQ')
    test('BQACAgIAAxkBAAEJnzNgit00IDsKd07OdSeanwz8osecYAACdAwAAueoWEicaPvNdOYEwB8E', 'AgADdAwAAueoWEg')
    test(
      'AAMCAgADGQEAAQmfM2CK3TQgOwp3Ts51J5qfDPyix5xgAAJ0DAAC56hYSJxo-8105gTAT_bYoy4AAwEAB20AA0JBAAIfBA',
      'AQADdAwAAueoWEhy',
    )
    test('CAACAgIAAxkBAAEJny9gituz1_V_uSKBUuG_nhtzEtFOeQACXFoAAuCjggfYjw_KAAGSnkgfBA', 'AgADXFoAAuCjggc')
  })

  it('serializes unique ids for profile pictures', () => {
    // big
    test('AQADAgATySHBDgAEAwAD0npI3Bb___-wfxjpg7QCPf8pBQABHwQ', 'AQADySHBDgAE_ykFAAE')
    // small
    test('AQADAgATySHBDgAEAgAD0npI3Bb___-wfxjpg7QCPf0pBQABHwQ', 'AQADySHBDgAE_SkFAAE')
  })
})
