import type { AsyncLock, ConditionVariable, Deque, timers } from '@fuman/utils'
import type { tl } from '@mtcute/tl'

import type { EarlyTimer, Logger, SortedArray } from '../../utils/index.js'
import type { CurrentUserInfo } from '../storage/service/current-user.js'
import type { PeersIndex } from '../types/peers/peers-index.js'

/** Information about a raw update. */
export class RawUpdateInfo {
  constructor(
    /** The update */
    readonly update: tl.TypeUpdate,
    /** Peers that are present in the update */
    readonly peers: PeersIndex,
  ) {}
}
/**
 * Parameters for the updates manager
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
   * > For some methods you need to always pass `shouldDispatch: true` explicitly.
   * > This is noted in the corresponding method's documentation by "Doesn't follow `disableNoDispatch`"
   *
   * @default false
   */
  disableNoDispatch?: boolean

  /**
   * **ADVANCED**
   *
   * PTS limit for `getChannelDifference` requests (max. 100000).
   * When there are more updates than this limit, the library will
   * skip some of them.
   * According to the [official docs](https://core.telegram.org/method/updates.getChannelDifference),
   * "Ordinary (non-bot) users are supposed to pass `10-100`", so passing >100
   * for users may lead to issues.
   *
   * @default 100 for users, 100000 for bots
   */
  channelPtsLimit?: number | ((channelId: number) => number)

  /**
   * **ADVANCED**
   *
   * Whenever an `updates.channelDifferenceTooLong` is received,
   * the library isn't able to efficiently handle it on its own,
   * and will call this function for you to handle it instead.
   *
   * [See docs](https://core.telegram.org/constructor/updates.channelDifferenceTooLong)
   */
  onChannelTooLong?: (channelId: number, update: tl.updates.RawChannelDifferenceTooLong) => void

  /**
   * **ADVANCED**
   *
   * When `openChat` method is used on a client, the library will
   * set up a timer to periodically fetch the new updates.
   * By default, it will respect the value provided by the server,
   * but it some cases you may want to override it (e.g. decrease it to
   * poll more often and potentially get updates faster).
   *
   * The returned value is treated as seconds.
   */
  overrideOpenChatTimeout?: (upd: tl.updates.TypeChannelDifference) => number

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

  pendingUpdateContainers: SortedArray<PendingUpdateContainer>
  pendingPtsUpdates: SortedArray<PendingUpdate>
  pendingPtsUpdatesPostponed: SortedArray<PendingUpdate>
  pendingQtsUpdates: SortedArray<PendingUpdate>
  pendingQtsUpdatesPostponed: SortedArray<PendingUpdate>
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
  channelDiffTimeouts: Map<number, timers.Timer>
  channelsOpened: Map<number, number>

  log: Logger
  stop: () => void
  auth: CurrentUserInfo | null
}
