import { tl } from '@mtcute/tl'
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
    constructor(
        readonly client: TelegramClient,
        readonly invite: tl.RawChatInvite,
        /**
         * Original invite link used to fetch this preview
         */
        readonly link: string
    ) {}

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
        if (this.invite.broadcast) return 'channel'
        if (this.invite.megagroup || this.invite.channel) return 'supergroup'
        return 'group'
    }

    /**
     * Whether this chat is public
     */
    get public(): boolean {
        return this.invite.public!
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
     * Whether by using this link you'll also need
     * to wait for admin approval.
     */
    get withApproval(): boolean {
        return this.invite.requestNeeded!
    }

    /**
     * Join this chat
     */
    async join(): Promise<Chat> {
        return this.client.joinChat(this.link)
    }
}

makeInspectable(ChatPreview, ['link'])
