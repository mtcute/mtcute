import { tl } from '@mtcute/tl'

import { AsyncLock, ConditionVariable, Deque, EarlyTimer, Logger, SortedLinkedList } from '../../utils/index.js'
import { CurrentUserInfo } from '../storage/service/current-user.js'
import { PeersIndex } from '../types/peers/peers-index.js'

/**
 * Function to be called for each update.
 *
 * @param upd  The update
 * @param peers  Peers that are present in the update
 */
export type RawUpdateHandler = (upd: tl.TypeUpdate, peers: PeersIndex) => void

/**
 * Parameters for {@link enableUpdatesProcessing}
 */
export interface UpdatesManagerParams {
    /**
     * **ADVANCED**
     *
     * Whether to globally disable no-dispatch mechanism.
     *
     * No-dispatch is a mechanism that allows you to call methods
     * that return updates and correctly handle them, without
     * actually dispatching them to the event handlers.
     *
     * In other words, the following code will work differently:
     * ```ts
     * dp.onNewMessage(console.log)
     * console.log(await tg.sendText('me', 'hello'))
     * ```
     * - if `disableNoDispatch` is `true`, the sent message will be
     *   dispatched to the event handler, thus it will be printed twice
     * - if `disableNoDispatch` is `false`, the sent message will not be
     *   dispatched to the event handler, thus it will onlt be printed once
     *
     * Disabling it may also improve performance, but it's not guaranteed.
     *
     * > **Note**: you can disable this on per-request basis by passing
     * > `shouldDispatch: true` to the method call that accepts it.
     *
     * @default false
     */
    disableNoDispatch?: boolean

    /**
     * Whether to catch up with missed updates when starting updates loop.
     *
     * > **Note**: In case the storage was not properly closed the last time,
     * > "catching up" might result in duplicate updates.
     */
    catchUp?: boolean
}

/** @internal */
export interface PendingUpdateContainer {
    upd: tl.TypeUpdates
    seqStart: number
    seqEnd: number
}

/** @internal */
export interface PendingUpdate {
    update: tl.TypeUpdate
    channelId?: number
    pts?: number
    ptsBefore?: number
    qts?: number
    qtsBefore?: number
    timeout?: number
    peers: PeersIndex
    fromDifference: boolean
}

/** @internal */
export interface UpdatesState {
    updatesLoopActive: boolean
    updatesLoopCv: ConditionVariable

    postponedTimer: EarlyTimer
    hasTimedoutPostponed: boolean

    pendingUpdateContainers: SortedLinkedList<PendingUpdateContainer>
    pendingPtsUpdates: SortedLinkedList<PendingUpdate>
    pendingPtsUpdatesPostponed: SortedLinkedList<PendingUpdate>
    pendingQtsUpdates: SortedLinkedList<PendingUpdate>
    pendingQtsUpdatesPostponed: SortedLinkedList<PendingUpdate>
    pendingUnorderedUpdates: Deque<PendingUpdate>

    noDispatchEnabled: boolean
    // channel id or 0 => msg id
    noDispatchMsg: Map<number, Set<number>>
    // channel id or 0 => pts
    noDispatchPts: Map<number, Set<number>>
    noDispatchQts: Set<number>

    lock: AsyncLock
    // rpsIncoming?: RpsMeter
    // rpsProcessing?: RpsMeter

    // accessing storage every time might be expensive,
    // so store everything here, and load & save
    // every time session is loaded & saved.
    pts?: number
    qts?: number
    date?: number
    seq?: number

    // old values of the updates state (i.e. as in DB)
    // used to avoid redundant storage calls
    oldPts?: number
    oldQts?: number
    oldDate?: number
    oldSeq?: number
    selfChanged: boolean

    // whether to catch up channels from the locally stored pts
    catchUpChannels: boolean
    catchUpOnStart: boolean

    cpts: Map<number, number>
    cptsMod: Map<number, number>
    channelDiffTimeouts: Map<number, NodeJS.Timeout>
    channelsOpened: Map<number, number>

    log: Logger
    stop: () => void
    handler: RawUpdateHandler
    auth: CurrentUserInfo | null
}
