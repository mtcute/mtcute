import Long from 'long'

import { tdFileId, toFileId, toUniqueFileId } from '@mtcute/file-id'
import { tl } from '@mtcute/tl'

import { getPlatform } from '../../../platform.js'
import { MtArgumentError } from '../../../types/errors.js'
import { toggleChannelIdMark } from '../../../utils/peer-utils.js'
import { strippedPhotoToJpg } from '../../utils/file-utils.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { FileLocation } from '../files/index.js'

/**
 * A size of a chat photo
 */
export class ChatPhotoSize extends FileLocation {
    constructor(
        readonly peer: tl.TypeInputPeer,
        readonly obj: tl.RawUserProfilePhoto | tl.RawChatPhoto,
        readonly big: boolean,
    ) {
        super(
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

    /**
     * TDLib and Bot API compatible File ID representing this size
     */
    get fileId(): string {
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

        return toFileId(getPlatform(), {
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

    /**
     * TDLib and Bot API compatible unique File ID representing this size
     */
    get uniqueFileId(): string {
        return toUniqueFileId(getPlatform(), tdFileId.FileType.ProfilePhoto, {
            _: 'photo',
            id: this.obj.photoId,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            source: {
                _: 'dialogPhoto',
                big: this.big,
                // will be looked into in MTQ-37
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
        })
    }
}

memoizeGetters(ChatPhotoSize, ['fileId', 'uniqueFileId'])
makeInspectable(ChatPhotoSize, ['dcId', 'big'])

/**
 * A chat photo
 */
export class ChatPhoto {
    constructor(
        readonly peer: tl.TypeInputPeer,
        readonly raw: tl.RawUserProfilePhoto | tl.RawChatPhoto,
    ) {}

    /**
     * Whether this photo is personal (i.e. you set it yourself for this peer)
     */
    get isPersonal(): boolean {
        return this.raw._ === 'userProfilePhoto' && this.raw.personal!
    }

    /** Chat photo file location in small resolution (160x160) */
    get small(): ChatPhotoSize {
        return new ChatPhotoSize(this.peer, this.raw, false)
    }

    /** Chat photo file location in big resolution (640x640) */
    get big(): ChatPhotoSize {
        return new ChatPhotoSize(this.peer, this.raw, true)
    }

    /**
     * Chat photo preview in *very* small resolution, if available
     */
    get thumb(): Uint8Array | null {
        if (!this.raw.strippedThumb) return null

        return strippedPhotoToJpg(this.raw.strippedThumb)
    }
}

memoizeGetters(ChatPhoto, ['small', 'big', 'thumb'])
makeInspectable(ChatPhoto, [], ['thumb'])
