import Long from 'long'

import { MtArgumentError, tl } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { Dialog } from '../../types'
import { normalizeDate } from '../../utils/misc-utils'

/**
 * Iterate over dialogs.
 *
 * Note that due to Telegram limitations,
 * ordering here can only be anti-chronological
 * (i.e. newest - first), and draft update date
 * is not considered when sorting.
 *
 * @param params  Fetch parameters
 * @internal
 */
export async function* getDialogs(
    this: TelegramClient,
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
         * Defaults to `Infinity`, i.e. all dialogs are fetched, ignored when `pinned=only`
         */
        limit?: number

        /**
         * Chunk size which will be passed to `messages.getDialogs`.
         * You shouldn't usually care about this.
         *
         * Defaults to 100.
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
         * Defaults to `include`.
         *
         * > **Note**: When using `include` mode with folders,
         * > pinned dialogs will only be fetched if all offset
         * > parameters are unset.
         */
        pinned?: 'include' | 'exclude' | 'only' | 'keep'

        /**
         * How to handle archived chats?
         *
         * Whether to `keep` them among other dialogs,
         * `exclude` them from the list, or `only`
         * return archived dialogs
         *
         * Defaults to `exclude`, ignored for folders since folders
         * themselves contain information about archived chats.
         *
         * > **Note**: when fetching `only` pinned dialogs
         * > passing `keep` will act as passing `only`
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
         * By default fetches from "All" folder
         */
        folder?: string | number | tl.RawDialogFilter

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

    // fetch folder if needed
    let filters: tl.TypeDialogFilter | undefined

    if (typeof params.folder === 'string' || typeof params.folder === 'number') {
        const folders = await this.getFolders()
        const found = folders.find((it) => {
            if (it._ === 'dialogFilterDefault') {
                return params!.folder === 0
            }

            return it.id === params!.folder || it.title === params!.folder
        })

        if (!found) {
            throw new MtArgumentError(`Could not find folder ${params.folder}`)
        }

        filters = found as tl.RawDialogFilter
    } else {
        filters = params.folder
    }

    if (params.filter) {
        if (filters) {
            filters = {
                ...filters,
                ...params.filter,
            }
        } else {
            filters = {
                _: 'dialogFilterDefault',
            }
        }
    }

    const fetchPinnedDialogsFromFolder = async (): Promise<tl.messages.RawPeerDialogs | null> => {
        if (!filters || filters._ === 'dialogFilterDefault' || !filters.pinnedPeers.length) {
            return null
        }
        const res = await this.call({
            _: 'messages.getPeerDialogs',
            peers: filters.pinnedPeers.map((peer) => ({
                _: 'inputDialogPeer',
                peer,
            })),
        })

        res.dialogs.forEach((dialog: tl.Mutable<tl.TypeDialog>) => (dialog.pinned = true))

        return res
    }

    const pinned = params.pinned ?? 'include'
    let archived = params.archived ?? 'exclude'

    if (filters) {
        archived = filters._ !== 'dialogFilterDefault' && filters.excludeArchived ? 'exclude' : 'keep'
    }

    if (pinned === 'only') {
        let res

        if (filters) {
            res = await fetchPinnedDialogsFromFolder()
        } else {
            res = await this.call({
                _: 'messages.getPinnedDialogs',
                folderId: archived === 'exclude' ? 0 : 1,
            })
        }
        if (res) yield* this._parseDialogs(res)

        return
    }

    let current = 0
    const total = params.limit ?? Infinity
    const chunkSize = Math.min(params.chunkSize ?? 100, total)

    let offsetId = params.offsetId ?? 0
    let offsetDate = normalizeDate(params.offsetDate) ?? 0
    let offsetPeer = params.offsetPeer ?? { _: 'inputPeerEmpty' }

    if (filters && filters._ !== 'dialogFilterDefault' && filters.pinnedPeers.length && pinned === 'include') {
        const res = await fetchPinnedDialogsFromFolder()

        if (res) {
            const dialogs = this._parseDialogs(res)

            for (const d of dialogs) {
                yield d

                if (++current >= total) return
            }
        }
    }

    // if pinned is `only`, this wouldn't be reached
    // if pinned is `exclude`, we want to exclude them
    // if pinned is `include`, we already yielded them, so we also want to exclude them
    // if pinned is `keep`, we want to keep them
    const filterFolder = filters ? Dialog.filterFolder(filters, pinned !== 'keep') : undefined

    let folderId

    if (archived === 'keep') {
        folderId = undefined
    } else if (archived === 'only') {
        folderId = 1
    } else {
        folderId = 0
    }

    for (;;) {
        const dialogs = this._parseDialogs(
            await this.call({
                _: 'messages.getDialogs',
                excludePinned: params.pinned === 'exclude',
                folderId,
                offsetDate,
                offsetId,
                offsetPeer,

                limit: chunkSize,
                hash: Long.ZERO,
            }),
        )
        if (!dialogs.length) return

        const last = dialogs[dialogs.length - 1]
        offsetPeer = last.chat.inputPeer
        offsetId = last.raw.topMessage
        offsetDate = normalizeDate(last.lastMessage?.date) ?? 0

        for (const d of dialogs) {
            if (filterFolder && !filterFolder(d)) continue

            yield d
            if (++current >= total) return
        }
    }
}
