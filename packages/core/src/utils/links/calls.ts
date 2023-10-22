import { deeplinkBuilder } from './common.js'

/**
 * Video chat/Livestream links
 *
 * Used to join video/voice chats in groups, and livestreams in channels.
 * Such links are generated using phone.exportGroupCallInvite.
 */
export const videoChat = deeplinkBuilder<{
    username: string
    /**
     * Invite hash exported if the `can_self_unmute` flag is set when calling `phone.exportGroupCallInvite`:
     * should be passed to `phone.joinGroupCall`, allows the user to speak in livestreams
     * or muted group chats.
     */
    inviteHash?: string
    isLivestream?: boolean
}>({
    internalBuild: ({ username, inviteHash, isLivestream }) => [
        'resolve',
        {
            domain: username,
            [isLivestream ? 'livestream' : 'videochat']: inviteHash || true,
        },
    ],
    externalBuild: ({ username, inviteHash, isLivestream }) => [
        username,
        {
            [isLivestream ? 'livestream' : 'videochat']: inviteHash || true,
        },
    ],
    internalParse: (path, query) => {
        if (path !== 'resolve') return null

        const domain = query.get('domain')
        if (!domain) return null

        const livestream = query.get('livestream')
        const videochat = query.get('videochat')
        const voicechat = query.get('voicechat')

        if (livestream === null && videochat === null && voicechat === null) return null

        const inviteHash = livestream || videochat || voicechat

        return {
            username: domain,
            inviteHash: inviteHash || undefined,
            isLivestream: livestream !== null,
        }
    },
    externalParse: (path, query) => {
        if (path.length <= 1 || path.includes('/') || path[0] === '+') return null

        const livestream = query.get('livestream')
        const videochat = query.get('videochat')
        const voicechat = query.get('voicechat')

        if (livestream === null && videochat === null && voicechat === null) return null

        const inviteHash = livestream || videochat || voicechat

        return {
            username: path,
            inviteHash: inviteHash || undefined,
            isLivestream: livestream !== null,
        }
    },
})
