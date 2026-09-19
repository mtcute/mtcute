import type { ITelegramClient } from '../../client.types.js'
import type { InputMessageId } from '../../types/index.js'
import { normalizeInputMessageId } from '../../types/index.js'
import { normalizeDate } from '../../utils/misc-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Approve a post suggested to a channel via its direct messages chat
 */
export async function approveSuggestedPost(
  client: ITelegramClient,
  params: InputMessageId & {
    /**
     * Date when the post should be published, if it wasn't chosen by the suggester.
     * Must be between `stars_suggested_post_future_min` and `stars_suggested_post_future_max`
     * seconds in the future (see `client.appConfig`).
     * When passing a number, a UNIX time in ms is expected.
     */
    scheduleDate?: Date | number

    /**
     * Whether to dispatch the updates caused by this action
     * to the client's update handler.
     */
    shouldDispatch?: true
  },
): Promise<void> {
  const { chatId, message } = normalizeInputMessageId(params)

  const res = await client.call({
    _: 'messages.toggleSuggestedPostApproval',
    peer: await resolvePeer(client, chatId),
    msgId: message,
    scheduleDate: normalizeDate(params.scheduleDate),
  })

  client.handleClientUpdate(res, !params.shouldDispatch)
}

/**
 * Decline a post suggested to a channel via its direct messages chat
 */
export async function declineSuggestedPost(
  client: ITelegramClient,
  params: InputMessageId & {
    /** Comment for the author of the suggested post */
    comment?: string

    /**
     * Whether to dispatch the updates caused by this action
     * to the client's update handler.
     */
    shouldDispatch?: true
  },
): Promise<void> {
  const { chatId, message } = normalizeInputMessageId(params)

  const res = await client.call({
    _: 'messages.toggleSuggestedPostApproval',
    peer: await resolvePeer(client, chatId),
    msgId: message,
    reject: true,
    rejectComment: params.comment,
  })

  client.handleClientUpdate(res, !params.shouldDispatch)
}
