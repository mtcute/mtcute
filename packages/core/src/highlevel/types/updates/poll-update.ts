import type { tl } from '../../../tl/index.js'

import type { Peer } from '../peers/peer.js'
import type { PeersIndex } from '../peers/peers-index.js'
import Long from 'long'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { Poll } from '../media/poll.js'
import { parsePeer } from '../peers/peer.js'

/**
 * Poll state has changed (stopped, somebody
 * has voted in an anonymous poll, etc.)
 *
 * Bots only receive updates about
 * polls which were sent by this bot
 */
export class PollUpdate {
  constructor(
    readonly raw: tl.RawUpdateMessagePoll,
    readonly _peers: PeersIndex,
  ) {}

  /**
   * Unique poll ID
   */
  get pollId(): tl.Long {
    return this.raw.pollId
  }

  /** Chat containing the message with the poll, if available */
  get chat(): Peer | null {
    return this.raw.peer ? parsePeer(this.raw.peer, this._peers) : null
  }

  /** ID of the message containing the poll, if available */
  get messageId(): number | null {
    return this.raw.msgId ?? null
  }

  /** ID of the thread (topic) containing the message with the poll, if available */
  get threadId(): number | null {
    return this.raw.topMsgId ?? null
  }

  /**
   * Whether this is a shortened version of update, not containing the poll itself.
   */
  get isShort(): boolean {
    return this.raw.poll === undefined
  }

  /**
   * The poll.
   *
   * When {@link isShort} is set, mtcute creates a stub poll
   * with empty question, answers and flags
   * (like `quiz`, `public`, etc.)
   *
   * If you need access to them, you should
   * map the {@link pollId} with full poll on your side
   * (e.g. in a database) and fetch from there.
   *
   * Bot API and TDLib do basically the same internally,
   * and thus are able to always provide them,
   * but mtcute currently does not have a way to do that.
   */
  get poll(): Poll {
    let poll = this.raw.poll

    if (!poll) {
      // create stub poll
      poll = {
        _: 'poll',
        id: this.raw.pollId,
        question: { _: 'textWithEntities', text: '', entities: [] },
        answers:
          this.raw.results.results?.map(res => ({
            _: 'pollAnswer' as const,
            text: {
              _: 'textWithEntities' as const,
              text: '',
              entities: [],
            },
            option: res.option,
          })) ?? [],
        hash: Long.ZERO,
      }
    }

    return new Poll(poll, this._peers, this.raw.results)
  }
}

memoizeGetters(PollUpdate, ['poll', 'chat'])
makeInspectable(PollUpdate)
