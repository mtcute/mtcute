import type { tl } from '@mtcute/tl'

import { assertNever } from '../../../types/utils.js'
import { assertTrue } from '../../../utils/type-assertions.js'
import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike, TypingStatus } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

import { _maybeInvokeWithBusinessConnection } from './_business-connection.js'

export function _mapTypingStatus(status: Exclude<TypingStatus, 'interaction' | 'interaction_seen'>, progress: number = 0): tl.TypeSendMessageAction {
    switch (status) {
        case 'typing':
            return { _: 'sendMessageTypingAction' }
        case 'cancel':
            return { _: 'sendMessageCancelAction' }
        case 'record_video':
            return { _: 'sendMessageRecordVideoAction' }
        case 'upload_video':
            return { _: 'sendMessageUploadVideoAction', progress }
        case 'record_voice':
            return { _: 'sendMessageRecordAudioAction' }
        case 'upload_voice':
            return { _: 'sendMessageUploadAudioAction', progress }
        case 'upload_photo':
            return { _: 'sendMessageUploadPhotoAction', progress }
        case 'upload_document':
            return { _: 'sendMessageUploadDocumentAction', progress }
        case 'geo':
            return { _: 'sendMessageGeoLocationAction' }
        case 'contact':
            return { _: 'sendMessageChooseContactAction' }
        case 'game':
            return { _: 'sendMessageGamePlayAction' }
        case 'record_round':
            return { _: 'sendMessageRecordRoundAction' }
        case 'upload_round':
            return { _: 'sendMessageUploadRoundAction', progress }
        case 'speak_call':
            return { _: 'speakingInGroupCallAction' }
        case 'history_import':
            return { _: 'sendMessageHistoryImportAction', progress }
        case 'sticker':
            return { _: 'sendMessageChooseStickerAction' }
        default:
            assertNever(status)
    }
}

/**
 * Sends a current user/bot typing event
 * to a conversation partner or group.
 *
 * This status is set for 6 seconds, and is
 * automatically cancelled if you send a
 * message.
 *
 * If you need a continuous typing status, use {@link setTyping} instead.
 *
 * @param chatId  Chat ID
 * @param status  Typing status
 * @param params
 */
export async function sendTyping(
    client: ITelegramClient,
    chatId: InputPeerLike,
    status: Exclude<TypingStatus, 'interaction' | 'interaction_seen'> | tl.TypeSendMessageAction = 'typing',
    params?: {
        /**
         * For `upload_*` and history import actions, progress of the upload
         */
        progress?: number

        /**
         * Unique identifier of the business connection on behalf of which the action will be sent
         */
        businessConnectionId?: string

        /**
         * For comment threads, ID of the thread (i.e. top message)
         */
        threadId?: number
    },
): Promise<void> {
    if (typeof status === 'string') {
        status = _mapTypingStatus(status, params?.progress ?? 0)
    }

    const r = await _maybeInvokeWithBusinessConnection(client, params?.businessConnectionId, {
        _: 'messages.setTyping',
        peer: await resolvePeer(client, chatId),
        action: status,
        topMsgId: params?.threadId,
    })

    assertTrue('messages.setTyping', r)
}
