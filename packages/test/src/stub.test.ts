import Long from 'long'
import { describe, expect, it } from 'vitest'

import { createStub } from './index.js'

describe('stub', () => {
    it('should correctly generate simple stubs', () => {
        expect(createStub('inputUser', { userId: 123 })).toEqual({
            _: 'inputUser',
            userId: 123,
            accessHash: Long.ZERO,
        })
    })

    it('should correctly generate stubs for optional fields', () => {
        expect(createStub('updateChannelTooLong')).toEqual({
            _: 'updateChannelTooLong',
            channelId: 0,
            pts: undefined,
        })
    })

    it('should correctly generate stubs for boolean flags', () => {
        expect(createStub('account.finishTakeoutSession')).toEqual({
            _: 'account.finishTakeoutSession',
            success: false,
        })
    })

    it('should correctly generate stubs for vectors', () => {
        expect(createStub('messageActionChatAddUser')).toEqual({
            _: 'messageActionChatAddUser',
            users: [],
        })
    })

    it('should correctly generate stubs for nested types', () => {
        expect(createStub('messageActionGroupCallScheduled', { scheduleDate: 123 })).toEqual({
            _: 'messageActionGroupCallScheduled',
            call: {
                _: 'inputGroupCall',
                id: Long.ZERO,
                accessHash: Long.ZERO,
            },
            scheduleDate: 123,
        })
    })
})
