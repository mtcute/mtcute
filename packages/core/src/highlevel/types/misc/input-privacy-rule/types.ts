import { tl } from '@mtcute/tl'

import { InputPeerLike } from '../../peers/peer.js'

export interface InputPrivacyRuleUsers {
    allow: boolean
    users: InputPeerLike[]
}

export interface InputPrivacyRuleChatParticipants {
    allow: boolean
    chats: InputPeerLike[]
}

export type InputPrivacyRule = InputPrivacyRuleChatParticipants | InputPrivacyRuleUsers | tl.TypeInputPrivacyRule
