import { tl } from '@mtcute/tl'

import { MtArgumentError } from '../../../types/errors.js'

const ERROR_MSG = 'Given peer is not available in this index. This is most likely an internal library error.'

export class PeersIndex {
    constructor(
        readonly users: Map<number, tl.TypeUser> = new Map(),
        readonly chats: Map<number, tl.TypeChat> = new Map(),
    ) {}

    hasMin = false

    static from(obj: { users?: tl.TypeUser[]; chats?: tl.TypeChat[] }): PeersIndex {
        const index = new PeersIndex()

        obj.users?.forEach((user) => {
            index.users.set(user.id, user)

            if ((user as Exclude<typeof user, tl.RawUserEmpty>).min) {
                index.hasMin = true
            }
        })
        obj.chats?.forEach((chat) => {
            index.chats.set(chat.id, chat)

            if (
                (
                    chat as Exclude<
                        typeof chat,
                        tl.RawChatEmpty | tl.RawChat | tl.RawChatForbidden | tl.RawChannelForbidden
                    >
                ).min
            ) {
                index.hasMin = true
            }
        })

        return index
    }

    get empty(): boolean {
        return this.users.size === 0 && this.chats.size === 0
    }

    user(id: number): tl.TypeUser {
        const r = this.users.get(id)

        if (!r) {
            throw new MtArgumentError(ERROR_MSG)
        }

        return r
    }

    chat(id: number): tl.TypeChat {
        const r = this.chats.get(id)

        if (!r) {
            throw new MtArgumentError(ERROR_MSG)
        }

        return r
    }

    get(peer: tl.TypePeer): tl.TypeUser | tl.TypeChat {
        switch (peer._) {
            case 'peerUser':
                return this.user(peer.userId)
            case 'peerChat':
                return this.chat(peer.chatId)
            case 'peerChannel':
                return this.chat(peer.channelId)
        }
    }
}
