import { createStub } from '@mtcute/test'
import { describe, expect, it } from 'vitest'

import { MessageEntity } from './message-entity.js'

describe('MessageEntity', () => {
  describe('params', () => {
    it('should parse diff entities', () => {
      expect(new MessageEntity(createStub('messageEntityDiffInsert')).params).toEqual({ kind: 'diff_insert' })
      expect(new MessageEntity(createStub('messageEntityDiffDelete')).params).toEqual({ kind: 'diff_delete' })
      expect(new MessageEntity(createStub('messageEntityDiffReplace', { oldText: 'foo' })).params).toEqual({
        kind: 'diff_replace',
        oldText: 'foo',
      })
    })

    it('should parse formatted date entities', () => {
      const entity = new MessageEntity(createStub('messageEntityFormattedDate', {
        date: 1700000000,
        longTime: true,
        shortDate: true,
        dayOfWeek: true,
      }))

      expect(entity.params).toEqual({
        kind: 'date_time',
        date: new Date(1700000000 * 1000),
        relative: false,
        timePrecision: 'long',
        datePrecision: 'short',
        showDayOfWeek: true,
      })
    })

    it('should parse relative formatted date entities', () => {
      const entity = new MessageEntity(createStub('messageEntityFormattedDate', {
        date: 1700000000,
        relative: true,
      }))

      expect(entity.params).toEqual({
        kind: 'date_time',
        date: new Date(1700000000 * 1000),
        relative: true,
        timePrecision: 'none',
        datePrecision: 'none',
        showDayOfWeek: false,
      })
    })
  })
})
