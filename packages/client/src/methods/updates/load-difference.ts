// import { TelegramClient } from '../../client'
// import { UpdateWithEntities } from '../../types/updates/utils'
// import { tl } from '@mtcute/tl'
// import { MAX_CHANNEL_ID } from '@mtcute/core'
//
//
// // @method
// export async function _loadDifference(
//     this: TelegramClient,
//     update: UpdateWithEntities,
//     channelId: number | undefined,
//     pts: number | null,
//     date?: number
// ): Promise<void> {
//     let result:
//         | tl.RpcCallReturn['updates.getChannelDifference']
//         | tl.RpcCallReturn['updates.getDifference']
//
//     if (channelId) {
//         let channel: tl.TypeInputChannel | null = null
//         try {
//             const ent = await this.resolvePeer(MAX_CHANNEL_ID - channelId)
//             if (ent._ === 'inputPeerChannel') {
//                 channel = { ...ent, _: 'inputChannel' }
//             }
//         } catch (e) {}
//         if (!channel) return
//
//         if (!pts) {
//             // first time, can't get diff. fetch pts instead
//             const result = await this.call({
//                 _: 'channels.getFullChannel',
//                 channel,
//             })
//             await this.storage.setChannelPts(
//                 channelId,
//                 (result.fullChat as tl.RawChannelFull).pts
//             )
//             return
//         }
//
//         result = await this.call({
//             _: 'updates.getChannelDifference',
//             channel,
//             filter: { _: 'channelMessagesFilterEmpty' },
//             pts,
//             limit: 100,
//             force: true
//         })
//     } else {
//         if (!date || !pts) {
//             // first time, can't get diff. fetch pts and date instead
//             const result = await this.call({ _: 'updates.getState' })
//             await this.storage.setCommonPts([result.pts, result.date])
//             return
//         }
//
//         result = await this.call({
//             _: 'updates.getDifference',
//             pts,
//             date,
//             qts: 0
//         })
//     }
//
//     if (
//         result._ === 'updates.difference' ||
//         result._ === 'updates.differenceSlice' ||
//         result._ === 'updates.channelDifference' ||
//         result._ === 'updates.channelDifferenceTooLong'
//     ) {
//         const users: Record<number, tl.TypeUser> = {}
//         result.users.forEach((u) => (users[u.id] = u))
//         const chats: Record<number, tl.TypeChat> = {}
//         result.chats.forEach((u) => (chats[u.id] = u))
//
//         update._chats = {
//             ...update._chats,
//             ...chats
//         }
//         update._users = {
//             ...update._users,
//             ...users
//         }
//     }
// }
