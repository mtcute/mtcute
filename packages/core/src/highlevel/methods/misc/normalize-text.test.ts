import type { tl } from '@mtcute/tl'
import { StubTelegramClient } from '@mtcute/test'
import { describe, expect, it } from 'vitest'
import { _normalizeInputText } from './normalize-text.js'

function createEntity<T extends tl.TypeMessageEntity['_']>(type: T, offset: number, length: number, additional?: Omit<tl.FindByName<tl.TypeMessageEntity, T>, '_' | 'offset' | 'length'>): tl.TypeMessageEntity {
    return {
        _: type,
        offset,
        length,
        ...(additional ?? {}),
    } as tl.TypeMessageEntity // idc really, its not that important
}

describe('_normalizeInputText', () => {
    const client = StubTelegramClient.offline()

    it('should trim whitespaces on edges', async () => {
        expect(await _normalizeInputText(client, {
            text: '  hello  ',
            entities: [createEntity('messageEntityBold', 0, 9)],
        })).toEqual([
            'hello',
            [createEntity('messageEntityBold', 0, 5)],
        ])
        expect(await _normalizeInputText(client, {
            text: '  hello  ',
            entities: [createEntity('messageEntityBold', 1, 8)],
        })).toEqual([
            'hello',
            [createEntity('messageEntityBold', 0, 5)],
        ])
        expect(await _normalizeInputText(client, {
            text: '  hello  :3',
            entities: [createEntity('messageEntityBold', 0, 9)],
        })).toEqual([
            'hello  :3',
            [createEntity('messageEntityBold', 0, 7)],
        ])
        expect(await _normalizeInputText(client, {
            text: '  hello  :3',
            entities: [createEntity('messageEntityBold', 1, 8)],
        })).toEqual([
            'hello  :3',
            [createEntity('messageEntityBold', 0, 7)],
        ])
        expect(await _normalizeInputText(client, {
            text: ':3  hello  ',
            entities: [createEntity('messageEntityBold', 2, 9)],
        })).toEqual([
            ':3  hello',
            [createEntity('messageEntityBold', 2, 7)],
        ])
    })

    it('should not trim whitespaces in the beginning in pre', async () => {
        expect(await _normalizeInputText(client, {
            text: '   meow\n   meow meow\n\n',
            entities: [createEntity('messageEntityPre', 0, 22, { language: '' })],
        })).toEqual([
            '   meow\n   meow meow',
            [createEntity('messageEntityPre', 0, 20, { language: '' })],
        ])
    })
})
