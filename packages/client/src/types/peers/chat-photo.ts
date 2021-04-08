import { tl } from '@mtcute/tl'
import { FileLocation } from '../files/file-location'
import { TelegramClient } from '../../client'
import { makeInspectable } from '../utils'

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

    private _smallFile?: FileLocation

    /** Chat photo file location in small resolution (160x160) */
    get small(): FileLocation {
        if (!this._smallFile) {
            this._smallFile = FileLocation.fromDeprecated(
                this.client,
                this.peer,
                this.obj.photoSmall,
                this.obj.dcId
            )
        }

        return this._smallFile
    }

    private _bigFile?: FileLocation

    /** Chat photo file location in big resolution (640x640) */
    get big(): FileLocation {
        if (!this._bigFile) {
            this._bigFile = FileLocation.fromDeprecated(
                this.client,
                this.peer,
                this.obj.photoBig,
                this.obj.dcId,
                true
            )
        }

        return this._bigFile
    }
}

makeInspectable(ChatPhoto)
