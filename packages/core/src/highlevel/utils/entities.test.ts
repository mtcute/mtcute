import { describe, expect, it } from 'vitest'

import { tl } from '@mtcute/tl'

import { joinTextWithEntities } from './entities.js'

const createEntity = (offset: number, length: number): tl.TypeMessageEntity => {
    return {
        _: 'messageEntityBold',
        offset,
        length,
    }
}

describe('joinTextWithEntities', () => {
    it('should join text with entities using a string delimiter', () => {
        expect(
            joinTextWithEntities(
                [
                    { text: 'foo bar baz', entities: [createEntity(0, 3), createEntity(4, 3), createEntity(8, 3)] },
                    { text: 'egg spam', entities: [createEntity(4, 4)] },
                    { text: 'very spam', entities: [createEntity(0, 4)] },
                ],
                ' 🚀 ',
            ),
        ).toEqual({
            text: 'foo bar baz 🚀 egg spam 🚀 very spam',
            entities: [
                createEntity(0, 3),
                createEntity(4, 3),
                createEntity(8, 3),
                createEntity(19, 4),
                createEntity(27, 4),
            ],
        })
    })

    it('should join text with entities using a TextWithEntities delimiter', () => {
        expect(
            joinTextWithEntities(
                [
                    { text: 'foo bar baz', entities: [createEntity(0, 3), createEntity(4, 3), createEntity(8, 3)] },
                    { text: 'egg spam', entities: [createEntity(4, 4)] },
                    { text: 'very spam', entities: [createEntity(0, 4)] },
                ],
                { text: ' 🚀 ', entities: [createEntity(1, 2)] },
            ),
        ).toEqual({
            text: 'foo bar baz 🚀 egg spam 🚀 very spam',
            entities: [
                createEntity(0, 3),
                createEntity(4, 3),
                createEntity(8, 3),
                createEntity(12, 2),
                createEntity(19, 4),
                createEntity(24, 2),
                createEntity(27, 4),
            ],
        })
    })
})
