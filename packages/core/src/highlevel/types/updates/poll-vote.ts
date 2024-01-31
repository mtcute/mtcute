import { tl } from '@mtcute/tl'

import { MtUnsupportedError } from '../../../types/errors.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { parsePeer, Peer, PeersIndex } from '../peers/index.js'

/**
 * Some user has voted in a public poll.
 *
 * Bots only receive new votes in polls
 * that were sent by this bot.
 */
export class PollVoteUpdate {
    constructor(
        readonly raw: tl.RawUpdateMessagePollVote,
        readonly _peers: PeersIndex,
    ) {}

    /**
     * Unique poll ID
     */
    get pollId(): tl.Long {
        return this.raw.pollId
    }

    /**
     * Peer who has voted
     */
    get peer(): Peer {
        return parsePeer(this.raw.peer, this._peers)
    }

    /**
     * Answers that the user has chosen.
     *
     * Note that due to incredible Telegram APIs, you
     * have to have the poll cached to be able to properly
     * tell which answers were chosen, since in the API
     * there are just arbitrary `Buffer`s, which are
     * defined by the client.
     *
     * However, most of the major implementations
     * (tested with TDLib and Bot API, official apps
     * for Android, Desktop, iOS/macOS) and mtcute
     * (by default) create `option` as a one-byte `Buffer`,
     * incrementing from `48` (ASCII `0`) up to `57` (ASCII `9`),
     * and ASCII representation would define index in the array.
     * Meaning, if `chosen[0][0] === 48` or `chosen[0].toString() === '0'`,
     * then the first answer (indexed with `0`) was chosen. To get the index,
     * you simply subtract `48` from the first byte.
     *
     * This might break at any time, but seems to be consistent for now.
     * To get chosen answer indexes derived as before, use {@link chosenIndexesAuto}.
     */
    get chosen(): ReadonlyArray<Uint8Array> {
        return this.raw.options
    }

    /**
     * Indexes of the chosen answers, derived based on observations
     * described in {@link chosen}.
     * This might break at any time, but seems to be consistent for now.
     *
     * If something does not add up, {@link MtUnsupportedError} is thrown
     */
    get chosenIndexesAuto(): ReadonlyArray<number> {
        return this.raw.options.map((buf) => {
            if (buf.length > 1) {
                throw new MtUnsupportedError('option had >1 byte')
            }
            if (buf[0] < 48 || buf[0] > 57) {
                throw new MtUnsupportedError('option had first byte out of 0-9 range')
            }

            return buf[0] - 48
        })
    }
}

memoizeGetters(PollVoteUpdate, ['peer'])
makeInspectable(PollVoteUpdate)
