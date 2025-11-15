import type { MaybeArray } from '@fuman/utils'
import type { ITelegramClient } from '../../client.types.js'
import type { InputMessageId, Message } from '../../types/index.js'
import { normalizeInputMessageId } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { _findMessageInUpdate } from './find-in-update.js'

/**
 * Toggle the completion status of a todo list item(s)
 *
 * @returns  Service message about the toggled items, if any.
 */
export async function toggleTodoCompleted(
  client: ITelegramClient,
  params: InputMessageId & {
    /** Items to mark as completed */
    completed: MaybeArray<number>
    /** Items to mark as uncompleted */
    uncompleted: MaybeArray<number>

    /**
     * Whether to dispatch the new message event
     * to the client's update handler.
     */
    shouldDispatch?: true
  },
): Promise<Message | null> {
  const { shouldDispatch, completed, uncompleted } = params

  const { chatId, message } = normalizeInputMessageId(params)

  const res = await client.call({
    _: 'messages.toggleTodoCompleted',
    peer: await resolvePeer(client, chatId),
    msgId: message,
    completed: Array.isArray(completed) ? completed : [completed],
    incompleted: Array.isArray(uncompleted) ? uncompleted : [uncompleted],
  })

  return _findMessageInUpdate(client, res, false, !shouldDispatch, true)
}
