import { Poll, UsersIndex } from '../'
import { TelegramClient } from '../../client'
import { tl } from '@mtqt/tl'
import { makeInspectable } from '../utils'

/**
 * Poll state has changed (stopped, somebody
 * has voted in an anonymous poll, etc.)
 *
 * Bots only receive updates about
 * polls which were sent by this bot
 */
export class PollUpdate {
    readonly client: TelegramClient
    readonly raw: tl.RawUpdateMessagePoll

    readonly _users: UsersIndex

    constructor(
        client: TelegramClient,
        raw: tl.RawUpdateMessagePoll,
        users: UsersIndex
    ) {
        this.client = client
        this.raw = raw
        this._users = users
    }

    /**
     * Unique poll ID
     */
    get pollId(): tl.Long {
        return this.raw.pollId
    }

    private _poll?: Poll
    /**
     * The poll.
     *
     * Note that sometimes the update does not have the poll
     * (Telegram limitation), and mtqt creates a stub poll
     * with empty question, answers and flags
     * (like `quiz`, `public`, etc.)
     *
     * If you need access to them, you should
     * map the {@link pollId} with full poll on your side
     * (e.g. in a database) and fetch from there.
     *
     * Bot API and TDLib do basically the same internally,
     * and thus are able to always provide them,
     * but mtqt tries to keep it simple in terms of local
     * storage and only stores the necessary information.
     */
    get poll(): Poll {
        if (!this._poll) {
            let poll = this.raw.poll
            if (!poll) {
                // create stub poll
                poll = {
                    _: 'poll',
                    id: this.raw.pollId,
                    question: '',
                    answers:
                        this.raw.results.results?.map((res) => ({
                            _: 'pollAnswer',
                            text: '',
                            option: res.option,
                        })) ?? [],
                }
            }

            this._poll = new Poll(
                this.client,
                poll,
                this._users,
                this.raw.results
            )
        }

        return this._poll
    }
}

makeInspectable(PollUpdate)
