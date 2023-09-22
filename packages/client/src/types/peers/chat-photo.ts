import Long from 'long'

import { MtArgumentError, toggleChannelIdMark } from '@mtcute/core'
import { tdFileId, toFileId, toUniqueFileId } from '@mtcute/file-id'
import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { strippedPhotoToJpg } from '../../utils/file-utils'
import { FileLocation } from '../files'
import { makeInspectable } from '../utils'

/**
 * A size of a chat photo
 */
export class ChatPhotoSize extends FileLocation {
    constructor(
        readonly client: TelegramClient,
        readonly peer: tl.TypeInputPeer,
        readonly obj: tl.RawUserProfilePhoto | tl.RawChatPhoto,
        readonly big: boolean,
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
            obj.dcId,
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
                    hash = Long.ZERO
                    break
                case 'inputPeerChannel':
                    id = toggleChannelIdMark(peer.channelId)
                    hash = peer.accessHash
                    break
                default:
                    // should not happen
                    throw new MtArgumentError('Input peer was invalid')
            }

            this._fileId = toFileId({
                dcId: this.obj.dcId,
                type: tdFileId.FileType.ProfilePhoto,
                fileReference: null,
                location: {
                    _: 'photo',
                    id: this.obj.photoId,
                    accessHash: Long.ZERO,
                    source: {
                        _: 'dialogPhoto',
                        big: this.big,
                        id: id,
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
        return (this._uniqueFileId ??= toUniqueFileId(
            tdFileId.FileType.ProfilePhoto,
            {
                _: 'photo',
                id: this.obj.photoId,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                source: {
                    _: 'dialogPhoto',
                    big: this.big,
                    // will be looked into in MTQ-37
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any,
            },
        ))
    }
}

makeInspectable(ChatPhotoSize, ['dcId', 'big'])

/**
 * A chat photo
 */
export class ChatPhoto {
    constructor(
        readonly client: TelegramClient,
        readonly peer: tl.TypeInputPeer,
        readonly raw: tl.RawUserProfilePhoto | tl.RawChatPhoto,
    ) {}

    private _smallFile?: ChatPhotoSize

    /**
     * Whether this photo is personal (i.e. you set it yourself for this peer)
     */
    get isPersonal(): boolean {
        return this.raw._ === 'userProfilePhoto' && this.raw.personal!
    }

    /** Chat photo file location in small resolution (160x160) */
    get small(): ChatPhotoSize {
        return (this._smallFile ??= new ChatPhotoSize(
            this.client,
            this.peer,
            this.raw,
            false,
        ))
    }

    private _bigFile?: ChatPhotoSize

    /** Chat photo file location in big resolution (640x640) */
    get big(): ChatPhotoSize {
        return (this._bigFile ??= new ChatPhotoSize(
            this.client,
            this.peer,
            this.raw,
            true,
        ))
    }

    private _thumb?: Buffer

    /**
     * Chat photo preview in *very* small resolution, if available
     */
    get thumb(): Buffer | null {
        if (!this.raw.strippedThumb) return null

        return (this._thumb ??= strippedPhotoToJpg(this.raw.strippedThumb))
    }
}

makeInspectable(ChatPhoto, [], ['thumb'])
