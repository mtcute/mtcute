import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { Poll } from '../media/poll.js'
import { PeersIndex } from '../peers/peers-index.js'

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
                    this.raw.results.results?.map((res) => ({
                        _: 'pollAnswer',
                        text: { _: 'textWithEntities', text: '', entities: [] },
                        option: res.option,
                    })) ?? [],
            }
        }

        return new Poll(poll, this._peers, this.raw.results)
    }
}

memoizeGetters(PollUpdate, ['poll'])
makeInspectable(PollUpdate)
