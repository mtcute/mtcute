import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { Photo } from '../media/photo.js'
import { User } from './user.js'

/**
 * Chat type. Can be:
 *  - `group`: Legacy group
 *  - `supergroup`: Supergroup
 *  - `channel`: Broadcast channel
 */
export type ChatPreviewType = 'group' | 'supergroup' | 'channel'

export class ChatPreview {
    constructor(
        readonly invite: tl.RawChatInvite,
        /**
         * Original invite link used to fetch this preview
         */
        readonly link: string,
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
    get type(): ChatPreviewType {
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

    /**
     * Chat photo
     */
    get photo(): Photo | null {
        if (this.invite.photo._ === 'photoEmpty') return null

        return new Photo(this.invite.photo)
    }

    /**
     * Preview of some of the chat members.
     *
     * This usually contains around 10 members,
     * and members that are inside your contacts list are
     * ordered before others.
     */
    get someMembers(): ReadonlyArray<User> {
        return this.invite.participants?.map((it) => new User(it)) ?? []
    }

    /**
     * Whether by using this link you'll also need
     * to wait for admin approval.
     */
    get withApproval(): boolean {
        return this.invite.requestNeeded!
    }
}

memoizeGetters(ChatPreview, ['photo', 'someMembers'])
makeInspectable(ChatPreview, ['link'])
