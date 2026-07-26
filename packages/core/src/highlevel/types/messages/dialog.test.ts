import type { tl } from '../../../tl/index.js'

import { createStub } from '@mtcute/test'
import { describe, expect, it } from 'vitest'

import { PeersIndex } from '../peers/peers-index.js'
import { Dialog } from './dialog.js'

function makeDialog(notify: Partial<tl.RawPeerNotifySettings>): Dialog {
  return new Dialog(
    createStub('dialog', { notifySettings: createStub('peerNotifySettings', notify) }),
    new PeersIndex(),
    new Map(),
  )
}

describe('Dialog', () => {
  describe('isMuted', () => {
    it('is true when muteUntil is in the future', () => {
      expect(makeDialog({ muteUntil: Math.floor(Date.now() / 1000) + 1000 }).isMuted).toBe(true)
    })

    it('is false when muteUntil is in the past', () => {
      expect(makeDialog({ muteUntil: Math.floor(Date.now() / 1000) - 1000 }).isMuted).toBe(false)
    })

    it('falls back to the silent flag when muteUntil is unset', () => {
      expect(makeDialog({ silent: true }).isMuted).toBe(true)
      expect(makeDialog({ silent: false }).isMuted).toBe(false)
    })

    it('is null when neither is set', () => {
      expect(makeDialog({}).isMuted).toBeNull()
    })
  })
})
