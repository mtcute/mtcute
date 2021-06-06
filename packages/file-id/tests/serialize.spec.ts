import { describe } from 'mocha'
import { expect } from 'chai'
import { parseFileId, toFileId } from '../src'

describe('serializing to file ids', () => {
    it('serializes previously parsed file ids', () => {
        const test = (fileId: string) => {
            expect(toFileId(parseFileId(fileId))).eq(fileId)
        }

        test(
            'CAACAgIAAxkBAAEJny9gituz1_V_uSKBUuG_nhtzEtFOeQACXFoAAuCjggfYjw_KAAGSnkgfBA'
        )
        test(
            'BQACAgIAAxkBAAEJnzNgit00IDsKd07OdSeanwz8osecYAACdAwAAueoWEicaPvNdOYEwB8E'
        )
        test(
            'AAMCAgADGQEAAQmfL2CK27PX9X-5IoFS4b-eG3MS0U55AAJcWgAC4KOCB9iPD8oAAZKeSK1c8w4ABAEAB20AA1kCAAIfBA'
        )
        test('AQADAgATqfDdly4AAwMAA4siCOX_____AAhKowIAAR8E')
        test('AQADAgATqfDdly4AAwIAA4siCOX_____AAhIowIAAR8E')
        test('AQADAgATySHBDgAEAwAD0npI3Bb___-wfxjpg7QCPf8pBQABHwQ')
        test('AQADAgATySHBDgAEAgAD0npI3Bb___-wfxjpg7QCPf0pBQABHwQ')
        test('CAADAQADegAD997LEUiQZafDlhIeHwQ')
    })
})
