import type { tl } from '../../../tl/index.js'
import type { ITelegramClient } from '../../client.types.js'

import { assertTrue } from '../../../utils/type-assertions.js'

/**
 * Edit shared state of a shared widget by its ID,
 * changing it for all messages containing the widget.
 */
// @available=bot
export async function editSharedWidgetData(
  client: ITelegramClient,
  params: {
    /** ID of the shared widget */
    widgetId: tl.Long

    /** New shared state of the widget (up to 1024 bytes) */
    publicData: string

    /**
     * Recommended interval (in seconds) at which clients should poll
     * the shared state (5-3600). Pass `0` to reset to the default (30 seconds)
     */
    cacheTime?: number
  },
): Promise<void> {
  const r = await client.call({
    _: 'messages.editWidgetData',
    widgetId: params.widgetId,
    publicData: params.publicData,
    cacheTime: params.cacheTime,
  })

  assertTrue('messages.editWidgetData', r)
}
