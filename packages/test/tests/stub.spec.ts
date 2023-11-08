import { expect } from 'chai'
import Long from 'long'
import { describe, it } from 'mocha'

import { createStub } from '../src/index.js'

describe('stub', () => {
    it('should correctly generate simple stubs', () => {
        expect(createStub('inputUser', { userId: 123 })).to.eql({
            _: 'inputUser',
            userId: 123,
            accessHash: Long.ZERO,
        })
    })

    it('should correctly generate stubs for optional fields', () => {
        expect(createStub('updateChannelTooLong')).to.eql({
            _: 'updateChannelTooLong',
            channelId: 0,
            pts: undefined,
        })
    })

    it('should correctly generate stubs for boolean flags', () => {
        expect(createStub('account.finishTakeoutSession')).to.eql({
            _: 'account.finishTakeoutSession',
            success: false,
        })
    })

    it('should correctly generate stubs for vectors', () => {
        expect(createStub('messageActionChatAddUser')).to.eql({
            _: 'messageActionChatAddUser',
            users: [],
        })
    })

    it('should correctly generate stubs for nested types', () => {
        expect(createStub('messageActionGroupCallScheduled', { scheduleDate: 123 })).to.eql({
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
