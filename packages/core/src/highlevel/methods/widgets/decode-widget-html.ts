import type { ITelegramClient } from '../../client.types.js'
import type { Widget } from '../../types/media/widget.js'

import { utf8 } from '@fuman/utils'

const MAX_WIDGET_HTML_SIZE = 32768

/**
 * Decompress HTML source of the given widget
 *
 * @param widget  Widget or its {@link Widget.payload}
 */
export async function decodeWidgetHtml(client: ITelegramClient, widget: Widget | Uint8Array): Promise<string> {
  const payload = widget instanceof Uint8Array ? widget : widget.payload

  return utf8.decoder.decode(await client.inflate(payload, MAX_WIDGET_HTML_SIZE))
}
