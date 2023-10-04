import { tl } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { assertTypeIs, makeInspectable } from '../../utils'
import { Chat, PeersIndex, User } from '../peers'
import { Story } from './story'

export class PeerStories {
    constructor(readonly client: TelegramClient, readonly raw: tl.RawPeerStories, readonly _peers: PeersIndex) {}

    private _peer?: User | Chat
    /**
     * Peer that owns these stories.
     */
    get peer(): User | Chat {
        if (this._peer) return this._peer

        switch (this.raw.peer._) {
            case 'peerUser':
                return (this._peer = new User(this.client, this._peers.user(this.raw.peer.userId)))
            case 'peerChat':
                return (this._peer = new Chat(this.client, this._peers.chat(this.raw.peer.chatId)))
            case 'peerChannel':
                return (this._peer = new Chat(this.client, this._peers.chat(this.raw.peer.channelId)))
        }
    }

    /**
     * ID of the last read story of this peer.
     */
    get maxReadId(): number {
        return this.raw.maxReadId ?? 0
    }

    private _stories?: Story[]
    /**
     * List of peer stories.
     */
    get stories(): Story[] {
        return (this._stories ??= this.raw.stories.map((it) => {
            assertTypeIs('PeerStories#stories', it, 'storyItem')

            return new Story(this.client, it, this._peers)
        }))
    }
}

makeInspectable(PeerStories)
