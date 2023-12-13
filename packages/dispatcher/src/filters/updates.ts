import { ChatMemberUpdate, ChatMemberUpdateType, MaybeArray, UserStatus, UserStatusUpdate } from '@mtcute/client'

import { UpdateFilter } from './types.js'

/**
 * Create a filter for {@link ChatMemberUpdate} by update type
 *
 * @param types  Update type(s)
 * @link ChatMemberUpdate.Type
 */
export const chatMember: {
    <T extends ChatMemberUpdateType>(type: T): UpdateFilter<ChatMemberUpdate, { type: T }>
    <T extends ChatMemberUpdateType[]>(types: T): UpdateFilter<ChatMemberUpdate, { type: T[number] }>
} = (types: MaybeArray<ChatMemberUpdateType>): UpdateFilter<ChatMemberUpdate> => {
    if (Array.isArray(types)) {
        const index: Partial<Record<ChatMemberUpdateType, true>> = {}
        types.forEach((typ) => (index[typ] = true))

        return (upd) => upd.type in index
    }

    return (upd) => upd.type === types
}

/**
 * Create a filter for {@link UserStatusUpdate} by new user status
 *
 * @param statuses  Update type(s)
 * @link User.Status
 */
export const userStatus: {
    <T extends UserStatus>(
        status: T,
    ): UpdateFilter<
        UserStatusUpdate,
        {
            type: T
            lastOnline: T extends 'offline' ? Date : null
            nextOffline: T extends 'online' ? Date : null
        }
    >
    <T extends UserStatus[]>(statuses: T): UpdateFilter<UserStatusUpdate, { type: T[number] }>
} = (statuses: MaybeArray<UserStatus>): UpdateFilter<UserStatusUpdate> => {
    if (Array.isArray(statuses)) {
        const index: Partial<Record<UserStatus, true>> = {}
        statuses.forEach((typ) => (index[typ] = true))

        return (upd) => upd.status in index
    }

    return (upd) => upd.status === statuses
}

/**
 * Create a filter for {@link ChatMemberUpdate} for updates
 * regarding current user
 */
export const chatMemberSelf: UpdateFilter<ChatMemberUpdate, { isSelf: true }> = (upd) => upd.isSelf
