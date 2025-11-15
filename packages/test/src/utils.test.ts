import { describe, expect, it } from 'vitest'

import { markedIdToPeer } from './utils.js'

describe('markedIdToPeer', () => {
  it('should correctly convert user ids', () => {
    expect(markedIdToPeer(12345)).toEqual({ _: 'peerUser', userId: 12345 })
  })

  it('should correctly convert chat ids', () => {
    expect(markedIdToPeer(-12345)).toEqual({ _: 'peerChat', chatId: 12345 })
  })

  it('should correctly convert channel ids', () => {
    expect(markedIdToPeer(-1000000012345)).toEqual({ _: 'peerChannel', channelId: 12345 })
  })
})
