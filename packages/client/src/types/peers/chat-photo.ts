import { tl } from '@mtqt/tl'
import { FileLocation } from '../files'
import { TelegramClient } from '../../client'
import { makeInspectable } from '../utils'
import { strippedPhotoToJpg } from '../../utils/file-utils'
import { tdFileId, toFileId, toUniqueFileId } from '@mtqt/file-id'
import bigInt from 'big-integer'
import { MAX_CHANNEL_ID } from '@mtqt/core'
import { MtqtArgumentError } from '../errors'

/**
 * A size of a chat photo
 */
export class ChatPhotoSize extends FileLocation {
    readonly obj: tl.RawUserProfilePhoto | tl.RawChatPhoto
    readonly peer: tl.TypeInputPeer
    readonly big: boolean

    constructor(
        client: TelegramClient,
        peer: tl.TypeInputPeer,
        obj: tl.RawUserProfilePhoto | tl.RawChatPhoto,
        big: boolean
    ) {
        super(
            client,
            {
                _: 'inputPeerPhotoFileLocation',
                peer,
                photoId: obj.photoId,
                big,
            },
            undefined,
            obj.dcId
        )

        this.peer = peer
        this.obj = obj
        this.big = big
    }

    private _fileId?: string

    /**
     * TDLib and Bot API compatible File ID representing this size
     */
    get fileId(): string {
        if (!this._fileId) {
            const peer = this.peer

            let id: number
            let hash: tl.Long
            switch (peer._) {
                case 'inputPeerUser':
                    id = peer.userId
                    hash = peer.accessHash
                    break
                case 'inputPeerChat':
                    id = -peer.chatId
                    hash = bigInt.zero
                    break
                case 'inputPeerChannel':
                    id = MAX_CHANNEL_ID - peer.channelId
                    hash = peer.accessHash
                    break
                default:
                    // should not happen
                    throw new MtqtArgumentError('Input peer was invalid')
            }

            this._fileId = toFileId({
                dcId: this.obj.dcId,
                type: tdFileId.FileType.ProfilePhoto,
                fileReference: null,
                location: {
                    _: 'photo',
                    id: this.obj.photoId,
                    accessHash: bigInt.zero,
                    source: {
                        _: 'dialogPhoto',
                        big: this.big,
                        id: bigInt(id),
                        accessHash: hash,
                    },
                },
            })
        }

        return this._fileId
    }

    private _uniqueFileId?: string
    /**
     * TDLib and Bot API compatible unique File ID representing this size
     */
    get uniqueFileId(): string {
        if (!this._uniqueFileId) {
            this._uniqueFileId = toUniqueFileId(
                tdFileId.FileType.ProfilePhoto,
                {
                    _: 'photo',
                    id: this.obj.photoId,
                    source: {
                        _: 'dialogPhoto',
                        big: this.big
                    } as any
                }
            )
        }

        return this._uniqueFileId
    }
}

makeInspectable(ChatPhotoSize, ['dcId', 'big'])

/**
 * A chat photo
 */
export class ChatPhoto {
    readonly client: TelegramClient
    readonly obj: tl.RawUserProfilePhoto | tl.RawChatPhoto
    readonly peer: tl.TypeInputPeer

    constructor(
        client: TelegramClient,
        peer: tl.TypeInputPeer,
        obj: tl.RawUserProfilePhoto | tl.RawChatPhoto
    ) {
        this.client = client
        this.peer = peer
        this.obj = obj
    }

    private _smallFile?: ChatPhotoSize

    /** Chat photo file location in small resolution (160x160) */
    get small(): ChatPhotoSize {
        if (!this._smallFile) {
            this._smallFile = new ChatPhotoSize(
                this.client,
                this.peer,
                this.obj,
                false
            )
        }

        return this._smallFile
    }

    private _bigFile?: ChatPhotoSize
    /** Chat photo file location in big resolution (640x640) */
    get big(): ChatPhotoSize {
        if (!this._bigFile) {
            this._bigFile = new ChatPhotoSize(
                this.client,
                this.peer,
                this.obj,
                true
            )
        }

        return this._bigFile
    }

    private _thumb?: Buffer

    /**
     * Chat photo preview in *very* small resolution, if available
     */
    get thumb(): Buffer | null {
        if (!this.obj.strippedThumb) return null

        if (!this._thumb) {
            this._thumb = strippedPhotoToJpg(this.obj.strippedThumb)
        }

        return this._thumb
    }
}

makeInspectable(ChatPhoto, [], ['thumb'])
