import type { tl } from '../../../tl/index.js'
import type { WebviewThemeParams } from '../../types/bots/webview.js'

/**
 * @internal
 * @noemit
 */
export function _normalizeWebviewTheme(theme: WebviewThemeParams | undefined): tl.TypeDataJSON | undefined {
  if (!theme) return undefined
  if ('_' in theme) return theme

  return {
    _: 'dataJSON',
    data: JSON.stringify(theme),
  }
}
