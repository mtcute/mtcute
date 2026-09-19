import type { ITelegramClient } from '../../client.types.js'
import type { InputMessageId } from '../../types/index.js'
import { normalizeInputMessageId, StatsGraph } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Get statistics of the votes in a poll.
 *
 * Only available if {@link Poll.canViewStats} is set
 *
 * @returns  Graph of the votes over time
 */
export async function getPollStats(
  client: ITelegramClient,
  params: InputMessageId & {
    /** Whether the graph should be generated for a dark theme */
    dark?: boolean
  },
): Promise<StatsGraph> {
  const { chatId, message } = normalizeInputMessageId(params)

  const res = await client.call({
    _: 'stats.getPollStats',
    peer: await resolvePeer(client, chatId),
    msgId: message,
    dark: params.dark,
  })

  return new StatsGraph(res.votesGraph)
}
