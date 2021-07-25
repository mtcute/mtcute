import { tl } from '@mtqt/tl'
import { TelegramClient } from '../../client'
import { makeInspectable } from '../utils'
import { Photo } from '../media'
import { User } from './user'
import { Chat } from './chat'

export namespace ChatPreview {
    /**
     * Chat type. Can be:
     *  - `group`: Legacy group
     *  - `supergroup`: Supergroup
     *  - `channel`: Broadcast channel
     */
    export type Type = 'group' | 'supergroup' | 'channel'
}

export class ChatPreview {
    readonly client: TelegramClient
    readonly invite: tl.RawChatInvite

    /**
     * Original invite link used to fetch
     * this preview
     */
    readonly link: string

    constructor(client: TelegramClient, raw: tl.RawChatInvite, link: string) {
        this.client = client
        this.invite = raw
        this.link = link
    }

    /**
     * Title of the chat
     */
    get title(): string {
        return this.invite.title
    }

    /**
     * Type of the chat
     */
    get type(): ChatPreview.Type {
        if (!this.invite.channel) return 'group'
        if (this.invite.broadcast) return 'channel'
        return 'supergroup'
    }

    /**
     * Total chat member count
     */
    get memberCount(): number {
        return this.invite.participantsCount
    }

    _photo?: Photo
    /**
     * Chat photo
     */
    get photo(): Photo | null {
        if (this.invite.photo._ === 'photoEmpty') return null

        if (!this._photo) {
            this._photo = new Photo(this.client, this.invite.photo)
        }

        return this._photo
    }

    private _someMembers?: User[]
    /**
     * Preview of some of the chat members.
     *
     * This usually contains around 10 members,
     * and members that are inside your contacts list are
     * ordered before others.
     */
    get someMembers(): ReadonlyArray<User> {
        if (!this._someMembers) {
            this._someMembers = this.invite.participants
                ? this.invite.participants.map(
                      (it) => new User(this.client, it)
                  )
                : []
        }

        return this._someMembers
    }

    /**
     * Join this chat
     */
    async join(): Promise<Chat> {
        return this.client.joinChat(this.link)
    }
}

makeInspectable(ChatPreview, ['link'])
