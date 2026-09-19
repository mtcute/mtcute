import type { tl } from '../../../tl/index.js'
import type { ITelegramClient } from '../../client.types.js'
import type { WebviewPlatform, WebviewThemeParams } from '../../types/bots/webview.js'

import { WebviewResult } from '../../types/bots/webview.js'
import { _normalizeWebviewTheme } from './_normalize-webview-theme.js'

// @available=user
/**
 * Open a webview of a guard bot, after {@link joinChat} returned `status: 'webview'`.
 *
 * Once the bot makes a decision, a {@link ChatJoinResultUpdate} will be sent.
 */
export async function openJoinChatWebview(
  client: ITelegramClient,
  params: {
    /** ID of the join query, as returned by {@link joinChat} */
    queryId: tl.Long

    /** Theme parameters to pass to the mini app */
    theme?: WebviewThemeParams

    /** Webview platform to use in the init data */
    platform: WebviewPlatform
  },
): Promise<WebviewResult> {
  const res = await client.call({
    _: 'messages.requestChatJoinWebView',
    queryId: params.queryId,
    themeParams: _normalizeWebviewTheme(params.theme),
    platform: params.platform,
  })

  return new WebviewResult(res)
}
