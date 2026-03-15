import type { tl } from '../../../../tl/index.js'

import type { InputPeerLike } from '../../peers/peer.js'

export interface InputPrivacyRuleUsers {
  allow: boolean
  users: InputPeerLike[]
}

export interface InputPrivacyRuleChatParticipants {
  allow: boolean
  chats: InputPeerLike[]
}

export type InputPrivacyRule = InputPrivacyRuleChatParticipants | InputPrivacyRuleUsers | tl.TypeInputPrivacyRule
