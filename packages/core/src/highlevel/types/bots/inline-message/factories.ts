import type { tl } from '../../../../tl/index.js'

import type { ITelegramClient } from '../../../client.types.js'
import type { InputText } from '../../../types/misc/entities.js'
import type { InputMediaGeoLive } from '../../media/index.js'
import type { InputRichMessage } from '../../messages/rich/types.js'
import type {
  InputInlineMessage,
  InputInlineMessageContact,
  InputInlineMessageGame,
  InputInlineMessageGeo,
  InputInlineMessageGeoLive,
  InputInlineMessageMedia,
  InputInlineMessageRich,
  InputInlineMessageSharedWidget,
  InputInlineMessageText,
  InputInlineMessageVenue,
  InputInlineMessageWebpage,
  InputInlineMessageWidget,
} from './types.js'
import { assertNever } from '../../../../types/utils.js'

import { _normalizeInputRichMessage } from '../../../methods/messages/normalize-rich-message.js'
import { _normalizeInputText } from '../../../methods/misc/normalize-text.js'
import { BotKeyboard } from '../keyboards/index.js'

/**
 * Create a text inline message
 *
 * @param text  Message text
 * @param params
 */
export function text(
  text: InputText,
  params: Omit<InputInlineMessageText, 'type' | 'text'> = {},
): InputInlineMessageText {
  const ret = params as tl.Mutable<InputInlineMessageText>
  ret.type = 'text'
  ret.text = text

  return ret
}

/**
 * Create a rich inline message
 *
 * @param rich  Input rich message
 * @param params
 */
export function rich(
  rich: tl.TypeInputRichMessage | InputRichMessage,
  params: Omit<InputInlineMessageRich, 'type' | 'content'> = {},
): InputInlineMessageRich {
  const ret = params as tl.Mutable<InputInlineMessageRich>
  ret.type = 'rich'
  ret.content = rich

  return ret
}

/**
 * Create an inline message containing
 * media from the result
 */
export function media(params: Omit<InputInlineMessageMedia, 'type'> = {}): InputInlineMessageMedia {
  const ret = params as tl.Mutable<InputInlineMessageMedia>
  ret.type = 'media'

  return ret
}

/**
 * Create an inline message containing a geolocation
 *
 * @param params  Additional parameters
 */
export function geo(params: Omit<InputInlineMessageGeo, 'type'>): InputInlineMessageGeo {
  const ret = params as tl.Mutable<InputInlineMessageGeo>
  ret.type = 'geo'

  return ret
}

/**
 * Create an inline message containing a live geolocation
 *
 * @param params  Additional parameters
 */
export function geoLive(params: Omit<InputInlineMessageGeoLive, 'type'>): InputInlineMessageGeoLive {
  const ret = params as tl.Mutable<InputInlineMessageGeoLive>
  ret.type = 'geo_live'

  return ret
}

/**
 * Create an inline message containing a venue
 */
export function venue(params: Omit<InputInlineMessageVenue, 'type'>): InputInlineMessageVenue {
  const ret = params as tl.Mutable<InputInlineMessageVenue>
  ret.type = 'venue'

  return ret
}

/**
 * Create an inline message containing a game
 * from the inline result
 */
export function game(params: Omit<InputInlineMessageGame, 'type'>): InputInlineMessageGame {
  const ret = params as tl.Mutable<InputInlineMessageGame>
  ret.type = 'game'

  return ret
}

/**
 * Create an inline message containing a contact
 */
export function contact(params: Omit<InputInlineMessageContact, 'type'>): InputInlineMessageContact {
  const ret = params as tl.Mutable<InputInlineMessageContact>
  ret.type = 'contact'

  return ret
}

/**
 * Create an inline message containing a webpage
 */
export function webpage(params: Omit<InputInlineMessageWebpage, 'type'>): InputInlineMessageWebpage {
  const ret = params as tl.Mutable<InputInlineMessageWebpage>
  ret.type = 'webpage'

  return ret
}

/**
 * Create an inline message containing an HTML widget
 *
 * @param html  HTML source of the widget
 * @param params  Additional parameters
 */
export function widget(
  html: string,
  params: Omit<InputInlineMessageWidget, 'type' | 'html'> = {},
): InputInlineMessageWidget {
  const ret = params as tl.Mutable<InputInlineMessageWidget>
  ret.type = 'widget'
  ret.html = html

  return ret
}

/**
 * Create an inline message containing a previously created shared widget
 *
 * @param id  ID of the shared widget
 * @param params  Additional parameters
 */
export function sharedWidget(
  id: tl.Long,
  params: Omit<InputInlineMessageSharedWidget, 'type' | 'widgetId'> = {},
): InputInlineMessageSharedWidget {
  const ret = params as tl.Mutable<InputInlineMessageSharedWidget>
  ret.type = 'shared_widget'
  ret.widgetId = id

  return ret
}

/** @internal */
export async function _convertToTl(
  client: ITelegramClient,
  obj: InputInlineMessage,
): Promise<tl.TypeInputBotInlineMessage> {
  switch (obj.type) {
    case 'text': {
      const [message, entities] = await _normalizeInputText(client, obj.text)

      return {
        _: 'inputBotInlineMessageText',
        message,
        entities,
        replyMarkup: BotKeyboard._convertToTl(obj.replyMarkup),
        noWebpage: obj.disableWebPreview,
        invertMedia: obj.invertMedia,
      }
    }
    case 'rich':
      return {
        _: 'inputBotInlineMessageRichMessage',
        replyMarkup: BotKeyboard._convertToTl(obj.replyMarkup),
        richMessage: '_' in obj.content ? obj.content : await _normalizeInputRichMessage(client, { _: 'inputPeerEmpty' }, obj.content, {}),
      }
    case 'media': {
      const [message, entities] = await _normalizeInputText(client, obj.text)

      return {
        _: 'inputBotInlineMessageMediaAuto',
        message,
        entities,
        replyMarkup: BotKeyboard._convertToTl(obj.replyMarkup),
        invertMedia: obj.invertMedia,
      }
    }
    case 'geo':
    case 'geo_live':
      return {
        _: 'inputBotInlineMessageMediaGeo',
        geoPoint: {
          _: 'inputGeoPoint',
          lat: obj.latitude,
          long: obj.longitude,
          accuracyRadius: obj.accuracy,
        },
        // fields will be `undefined` if this is a `geo`
        heading: (obj as InputMediaGeoLive).heading,
        period: (obj as InputMediaGeoLive).period,
        proximityNotificationRadius: (obj as InputMediaGeoLive).proximityNotificationRadius,
        replyMarkup: BotKeyboard._convertToTl(obj.replyMarkup),
      }
    case 'venue':
      return {
        _: 'inputBotInlineMessageMediaVenue',
        geoPoint: {
          _: 'inputGeoPoint',
          lat: obj.latitude,
          long: obj.longitude,
        },
        title: obj.title,
        address: obj.address,
        provider: obj.source?.provider ?? '',
        venueId: obj.source?.id ?? '',
        venueType: obj.source?.type ?? '',
        replyMarkup: BotKeyboard._convertToTl(obj.replyMarkup),
      }
    case 'game':
      return {
        _: 'inputBotInlineMessageGame',
        replyMarkup: BotKeyboard._convertToTl(obj.replyMarkup),
      }
    case 'contact':
      return {
        _: 'inputBotInlineMessageMediaContact',
        phoneNumber: obj.phone,
        firstName: obj.firstName,
        lastName: obj.lastName ?? '',
        vcard: obj.vcard ?? '',
        replyMarkup: BotKeyboard._convertToTl(obj.replyMarkup),
      }
    case 'webpage': {
      const [message, entities] = await _normalizeInputText(client, obj.text)

      return {
        _: 'inputBotInlineMessageMediaWebPage',
        message,
        entities,
        replyMarkup: BotKeyboard._convertToTl(obj.replyMarkup),
        invertMedia: obj.invertMedia,
        forceLargeMedia: obj.size === 'large',
        forceSmallMedia: obj.size === 'small',
        optional: !obj.required,
        url: obj.url,
      }
    }
    case 'widget': {
      const [message, entities] = await _normalizeInputText(client, obj.text)

      return {
        _: 'inputBotInlineMessageWidget',
        html: obj.html,
        width: obj.width ?? 0,
        height: obj.height ?? 0,
        allowQueries: obj.allowQueries,
        sharedWidget: obj.shared,
        publicData: obj.publicData,
        chatData: obj.chatData,
        replyMarkup: BotKeyboard._convertToTl(obj.replyMarkup),
        invertMedia: obj.invertMedia,
        message,
        entities,
      }
    }
    case 'shared_widget': {
      const [message, entities] = await _normalizeInputText(client, obj.text)

      return {
        _: 'inputBotInlineMessageWidgetId',
        widgetId: obj.widgetId,
        chatData: obj.chatData,
        replyMarkup: BotKeyboard._convertToTl(obj.replyMarkup),
        invertMedia: obj.invertMedia,
        message,
        entities,
      }
    }
    default:
      assertNever(obj)
  }
}
