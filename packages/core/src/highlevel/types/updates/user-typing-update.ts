import type { tl } from '@mtcute/tl'

import type { BasicPeerType } from '../../../types/peers.js'
import type { TypingStatus } from '../peers/index.js'
import { assertNever } from '../../../types/utils.js'
import { getBarePeerId, toggleChannelIdMark } from '../../../utils/peer-utils.js'
import { makeInspectable } from '../../utils/index.js'

/**
 * User's typing status has changed.
 *
 * This update is valid for 6 seconds.
 */
export class UserTypingUpdate {
    constructor(readonly raw: tl.RawUpdateUserTyping | tl.RawUpdateChatUserTyping | tl.RawUpdateChannelUserTyping) {}

    /**
     * ID of the user whose typing status changed
     */
    get userId(): number {
        return this.raw._ === 'updateUserTyping' ? this.raw.userId : getBarePeerId(this.raw.fromId)
    }

    /**
     * Marked ID of the chat where the user is typing,
     *
     * If the user is typing in PMs, this will
     * equal to {@link userId}
     */
    get chatId(): number {
        switch (this.raw._) {
            case 'updateUserTyping':
                return this.raw.userId
            case 'updateChatUserTyping':
                return -this.raw.chatId
            case 'updateChannelUserTyping':
                return toggleChannelIdMark(this.raw.channelId)
        }
    }

    /** ID of the thread/topic where the user is typing, if applicable */
    get threadId(): number | null {
        switch (this.raw._) {
            case 'updateUserTyping':
                return this.raw.topMsgId ?? null
            case 'updateChatUserTyping':
                return null
            case 'updateChannelUserTyping':
                return this.raw.topMsgId ?? null
        }
    }

    /**
     * Type of the chat where this event has occurred
     */
    get chatType(): BasicPeerType {
        switch (this.raw._) {
            case 'updateUserTyping':
                return 'user'
            case 'updateChatUserTyping':
                return 'chat'
            case 'updateChannelUserTyping':
                return 'channel'
        }
    }

    /**
     * Current typing status
     */
    get status(): TypingStatus {
        switch (this.raw.action._) {
            case 'sendMessageTypingAction':
            case 'sendMessageTextDraftAction':
                return 'typing'
            case 'sendMessageCancelAction':
                return 'cancel'
            case 'sendMessageRecordVideoAction':
                return 'record_video'
            case 'sendMessageUploadVideoAction':
                return 'upload_video'
            case 'sendMessageRecordAudioAction':
                return 'record_voice'
            case 'sendMessageUploadAudioAction':
                return 'upload_voice'
            case 'sendMessageUploadPhotoAction':
                return 'upload_photo'
            case 'sendMessageUploadDocumentAction':
                return 'upload_document'
            case 'sendMessageGeoLocationAction':
                return 'geo'
            case 'sendMessageGamePlayAction':
                return 'game'
            case 'sendMessageChooseContactAction':
                return 'contact'
            case 'sendMessageRecordRoundAction':
                return 'record_round'
            case 'sendMessageUploadRoundAction':
                return 'upload_round'
            case 'speakingInGroupCallAction':
                return 'speak_call'
            case 'sendMessageHistoryImportAction':
                return 'history_import'
            case 'sendMessageChooseStickerAction':
                return 'sticker'
            case 'sendMessageEmojiInteraction':
                return 'interaction'
            case 'sendMessageEmojiInteractionSeen':
                return 'interaction_seen'
            default:
                assertNever(this.raw.action)
        }
    }
}

makeInspectable(UserTypingUpdate)
