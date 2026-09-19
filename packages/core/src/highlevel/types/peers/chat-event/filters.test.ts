import { describe, expect, it } from 'vitest'

import { normalizeChatEventFilters } from './filters.js'

describe('normalizeChatEventFilters', () => {
  it('should map participant_rank_edited to the editRank server filter', () => {
    expect(normalizeChatEventFilters('participant_rank_edited')).toEqual({
      serverFilter: { _: 'channelAdminLogEventsFilter', editRank: true },
      localFilter: { participant_rank_edited: true },
    })
  })

  it('should map sub_extend to the subExtend server filter', () => {
    expect(normalizeChatEventFilters('sub_extend').serverFilter).toEqual({
      _: 'channelAdminLogEventsFilter',
      subExtend: true,
    })
  })

  it('should map msg_sent to the send server filter', () => {
    expect(normalizeChatEventFilters('msg_sent').serverFilter).toEqual({
      _: 'channelAdminLogEventsFilter',
      send: true,
    })
  })
})
