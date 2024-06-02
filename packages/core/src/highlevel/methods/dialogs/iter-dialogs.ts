import Long from 'long'

import { tl } from '@mtcute/tl'

import { MtArgumentError } from '../../../types/errors.js'
import { ITelegramClient } from '../../client.types.js'
import { Dialog, InputDialogFolder } from '../../types/index.js'
import { normalizeDate } from '../../utils/misc-utils.js'
import { _normalizeInputFolder } from './get-folders.js'

/**
 * Iterate over dialogs.
 *
 * Note that due to Telegram API limitations,
 * ordering here can only be anti-chronological
 * (i.e. newest - first), and draft update date
 * is not considered when sorting.
 *
 * @param params  Fetch parameters
 */
export async function* iterDialogs(
    client: ITelegramClient,
    params?: {
        /**
         * Offset message date used as an anchor for pagination.
         */
        offsetDate?: Date | number

        /**
         * Offset message ID used as an anchor for pagination
         */
        offsetId?: number

        /**
         * Offset peer used as an anchor for pagination
         */
        offsetPeer?: tl.TypeInputPeer

        /**
         * Limits the number of dialogs to be received.
         *
         * @default  `Infinity`, i.e. all dialogs are fetched
         */
        limit?: number

        /**
         * Chunk size which will be passed to `messages.getDialogs`.
         * You shouldn't usually care about this.
         *
         * @default  100.
         */
        chunkSize?: number

        /**
         * How to handle pinned dialogs?
         *
         * Whether to `include` them at the start of the list,
         * `exclude` them at all, or `only` return pinned dialogs.
         *
         * Additionally, for folders you can specify
         * `keep`, which will return pinned dialogs
         * ordered by date among other non-pinned dialogs.
         *
         * > **Note**: When using `include` mode with folders,
         * > pinned dialogs will only be fetched if all offset
         * > parameters are unset.
         *
         * @default  `include`.
         */
        pinned?: 'include' | 'exclude' | 'only' | 'keep'

        /**
         * How to handle archived chats?
         *
         * Whether to `keep` them among other dialogs,
         * `exclude` them from the list, or `only`
         * return archived dialogs
         *
         * Ignored for folders, since folders
         * themselves contain information about archived chats.
         *
         * > **Note**: when `pinned=only`, `archived=keep` will act as `only`
         * > because of Telegram API limitations.
         *
         * @default  `exclude`
         */
        archived?: 'keep' | 'exclude' | 'only'

        /**
         * Folder from which the dialogs will be fetched.
         *
         * You can pass folder object, id or title
         *
         * Note that passing anything except object will
         * cause the list of the folders to be fetched,
         * and passing a title may fetch from
         * a wrong folder if you have multiple with the same title.
         *
         * Also note that fetching dialogs in a folder is
         * *orders of magnitudes* slower than normal because
         * of Telegram API limitations - we have to fetch all dialogs
         * and filter the ones we need manually. If possible,
         * use {@link Dialog.filterFolder} instead.
         *
         * When a folder with given ID or title is not found,
         * {@link MtArgumentError} is thrown
         *
         * @default  <empty> (fetches from "All" folder)
         */
        folder?: InputDialogFolder

        /**
         * Additional filtering for the dialogs.
         *
         * If `folder` is not provided, this filter is used instead.
         * If `folder` is provided, fields from this object are used
         * to override filters inside the folder.
         */
        filter?: Partial<Omit<tl.RawDialogFilter, '_' | 'id' | 'title'>>
    },
): AsyncIterableIterator<Dialog> {
    if (!params) params = {}

    const { limit = Infinity, chunkSize = 100, folder, filter, pinned = 'include' } = params

    let { offsetId = 0, offsetPeer = { _: 'inputPeerEmpty' }, archived = 'exclude' } = params

    let offsetDate = normalizeDate(params.offsetDate) ?? 0

    let localFilters_: tl.TypeDialogFilter | undefined

    if (folder) {
        localFilters_ = await _normalizeInputFolder(client, folder)
    }

    if (filter) {
        if (localFilters_ && localFilters_._ !== 'dialogFilterDefault') {
            localFilters_ = {
                ...localFilters_,
                ...filter,
            }
        } else {
            localFilters_ = {
                _: 'dialogFilter',
                id: 0,
                title: '',
                pinnedPeers: [],
                includePeers: [],
                excludePeers: [],
                ...params.filter,
            }
        }
    }

    if (localFilters_?._ === 'dialogFilterDefault') {
        localFilters_ = undefined
    }

    const localFilters = localFilters_

    if (localFilters?._ === 'dialogFilterChatlist') {
        if (offsetId !== 0 || offsetDate !== 0 || offsetPeer._ !== 'inputPeerEmpty') {
            throw new MtArgumentError('Cannot use offset parameters with chatlist filters')
        }

        // we only need to fetch pinnedPeers and includePeers
        // instead of fetching the entire dialog list, we can shortcut
        // and just fetch the peer dialogs

        let remaining = Math.min(limit, localFilters.includePeers.length + localFilters.pinnedPeers.length)

        if (pinned === 'include' || pinned === 'only') {
            // yield pinned dialogs

            const peers: tl.TypeInputDialogPeer[] = []

            for (const peer of localFilters.pinnedPeers) {
                if (remaining <= 0) break
                remaining--
                peers.push({
                    _: 'inputDialogPeer',
                    peer,
                })
            }

            const res = await client.call({
                _: 'messages.getPeerDialogs',
                peers,
            })

            res.dialogs.forEach((dialog: tl.Mutable<tl.TypeDialog>) => (dialog.pinned = true))

            yield* Dialog.parseTlDialogs(res)
        }

        if (pinned === 'only' || remaining <= 0) {
            return
        }

        // yield non-pinned dialogs

        let offset = 0

        while (remaining > 0) {
            const peers: tl.TypeInputDialogPeer[] = []

            for (let i = 0; i < chunkSize; i++) {
                if (remaining <= 0) break
                remaining--
                peers.push({
                    _: 'inputDialogPeer',
                    peer: localFilters.includePeers[offset + i],
                })
            }

            offset += chunkSize

            const res = await client.call({
                _: 'messages.getPeerDialogs',
                peers,
            })

            yield* Dialog.parseTlDialogs(res)
        }

        return
    }

    if (localFilters) {
        archived = localFilters.excludeArchived ? 'exclude' : 'keep'
    }

    const fetchPinnedDialogsFromFolder = async (): Promise<tl.messages.RawPeerDialogs | null> => {
        if (!localFilters || !localFilters.pinnedPeers.length) {
            return null
        }
        const res = await client.call({
            _: 'messages.getPeerDialogs',
            peers: localFilters.pinnedPeers.map((peer) => ({
                _: 'inputDialogPeer' as const,
                peer,
            })),
        })

        res.dialogs.forEach((dialog: tl.Mutable<tl.TypeDialog>) => (dialog.pinned = true))

        return res
    }

    if (pinned === 'only') {
        let res

        if (localFilters) {
            res = await fetchPinnedDialogsFromFolder()
        } else {
            res = await client.call({
                _: 'messages.getPinnedDialogs',
                folderId: archived === 'exclude' ? 0 : 1,
            })
        }
        if (res) yield* Dialog.parseTlDialogs(res, limit)

        return
    }

    let current = 0

    if (
        localFilters?.pinnedPeers.length &&
        pinned === 'include' &&
        offsetId === 0 &&
        offsetDate === 0 &&
        offsetPeer._ === 'inputPeerEmpty'
    ) {
        const res = await fetchPinnedDialogsFromFolder()

        if (res) {
            const dialogs = Dialog.parseTlDialogs(res, limit)

            for (const d of dialogs) {
                yield d
                if (++current >= limit) return
            }
        }
    }
    // if pinned is `only`, this wouldn't be reached
    // if pinned is `exclude`, we want to exclude them
    // if pinned is `include`, we already yielded them, so we also want to exclude them
    // if pinned is `keep`, we want to keep them
    const filterFolder = localFilters ? Dialog.filterFolder(localFilters, pinned !== 'keep') : undefined

    let folderId

    if (archived === 'keep') {
        folderId = undefined
    } else if (archived === 'only') {
        folderId = 1
    } else {
        folderId = 0
    }

    for (;;) {
        const dialogs = Dialog.parseTlDialogs(
            await client.call({
                _: 'messages.getDialogs',
                excludePinned: params.pinned === 'exclude',
                folderId,
                offsetDate,
                offsetId,
                offsetPeer,
                limit: filterFolder ? chunkSize : Math.min(limit - current, chunkSize),
                hash: Long.ZERO,
            }),
        )
        if (!dialogs.length) return

        const last = dialogs[dialogs.length - 1]
        offsetPeer = last.chat.inputPeer
        offsetId = last.raw.topMessage

        if (last.lastMessage) {
            offsetDate = last.lastMessage.raw.date
        }

        for (const d of dialogs) {
            if (filterFolder && !filterFolder(d)) continue

            yield d
            if (++current >= limit) return
        }
    }
}
