import {
    BasicPeerType,
    Chat,
    MtCuteUnsupportedError,
    TelegramClient,
    User,
    TypingStatus,
} from '@mtcute/client'
import { tl } from '@mtcute/tl'
import { getBarePeerId, MAX_CHANNEL_ID } from '@mtcute/core'
import { makeInspectable } from '../utils'

/**
 * User's typing status has changed.
 *
 * This update is valid for 6 seconds.
 */
export class UserTypingUpdate {
    readonly client: TelegramClient
    readonly raw:
        | tl.RawUpdateUserTyping
        | tl.RawUpdateChatUserTyping
        | tl.RawUpdateChannelUserTyping

    constructor(client: TelegramClient, raw: UserTypingUpdate['raw']) {
        this.client = client
        this.raw = raw
    }

    /**
     * ID of the user whose typing status changed
     */
    get userId(): number {
        return this.raw._ === 'updateUserTyping'
            ? this.raw.userId
            : getBarePeerId(this.raw.fromId)
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
                return MAX_CHANNEL_ID - this.raw.channelId
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
        }

        throw new MtCuteUnsupportedError()
    }

    /**
     * Fetch the user whose typing status has changed
     */
    getUser(): Promise<User> {
        return this.client.getUsers(this.userId)
    }

    /**
     * Fetch the chat where the update has happenned
     */
    getChat(): Promise<Chat> {
        return this.client.getChat(this.chatId)
    }
}

makeInspectable(UserTypingUpdate)
