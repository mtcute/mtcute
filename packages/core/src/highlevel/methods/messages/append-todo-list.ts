import type { MaybeArray } from '@fuman/utils'
import type { ITelegramClient } from '../../client.types.js'
import type { InputMessageId, InputText, Message } from '../../types/index.js'
import { assert } from '@fuman/utils'
import { inputTextToTl, normalizeInputMessageId } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { _findMessageInUpdate } from './find-in-update.js'
import { getMessages } from './get-messages.js'

/**
 * Append item(s) to a todo list
 *
 * @returns  Service message about the appended todo item(s), if any.
 */
export async function appendTodoList(
  client: ITelegramClient,
  params: InputMessageId & {
    /** Items to append */
    items: MaybeArray<InputText>

    /**
     * Whether to dispatch the new message event
     * to the client's update handler.
     */
    shouldDispatch?: true
  },
): Promise<Message | null> {
  const { items, shouldDispatch } = params

  const { chatId, message } = normalizeInputMessageId(params)
  let msgObject
  if (typeof params.message === 'number') {
    // we need to fetch the message to get the item id
    const [msg] = await getMessages(client, chatId, [message])
    assert(msg != null, 'message not found')
    msgObject = msg
  } else {
    msgObject = params.message
  }

  assert(msgObject?.media?.type === 'todo', 'message is not a todo list')
  const itemId = Math.max(...msgObject.media.items.map(i => i.id)) + 1
  const res = await client.call({
    _: 'messages.appendTodoList',
    peer: await resolvePeer(client, chatId),
    msgId: message,
    list: (Array.isArray(items) ? items : [items]).map((item, index) => ({
      _: 'todoItem',
      id: itemId + index,
      title: inputTextToTl(item),
    })),
  })

  return _findMessageInUpdate(client, res, false, !shouldDispatch, true)
}
