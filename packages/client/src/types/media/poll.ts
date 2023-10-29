import { Long, tl } from '@mtcute/core'

import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { MessageEntity } from '../messages/message-entity.js'
import { PeersIndex } from '../peers/peers-index.js'

export interface PollAnswer {
    /**
     * Answer text
     */
    text: string

    /**
     * Answer data, to be passed to
     * {@link TelegramClient.sendVote}
     */
    data: Uint8Array

    /**
     * Number of people who has chosen this result.
     * If not available (i.e. not voted yet)
     *
     * @default  `0`
     */
    voters: number

    /**
     * Whether this answer was chosen by the current user
     */
    chosen: boolean

    /**
     * Whether this answer is correct (for quizzes).
     * Not available before choosing an answer
     *
     * @default  `false`
     */
    correct: boolean
}

export class Poll {
    readonly type = 'poll' as const

    constructor(
        readonly raw: tl.TypePoll,
        readonly _peers: PeersIndex,
        readonly results?: tl.TypePollResults,
    ) {}

    /**
     * Unique identifier of the poll
     */
    get id(): tl.Long {
        return this.raw.id
    }

    /**
     * Poll question
     */
    get question(): string {
        return this.raw.question
    }

    /**
     * List of answers in this poll
     */
    get answers(): ReadonlyArray<PollAnswer> {
        const results = this.results?.results

        return this.raw.answers.map((ans, idx) => {
            if (results) {
                const res = results[idx]

                return {
                    text: ans.text,
                    data: ans.option,
                    voters: res.voters,
                    chosen: Boolean(res.chosen),
                    correct: Boolean(res.correct),
                }
            }

            return {
                text: ans.text,
                data: ans.option,
                voters: 0,
                chosen: false,
                correct: false,
            }
        })
    }

    /**
     * Total number of voters in this poll, if available
     */
    get voters(): number {
        return this.results?.totalVoters ?? 0
    }

    /**
     * Whether this poll is closed, i.e. does not
     * accept votes anymore
     */
    get isClosed(): boolean {
        return this.raw.closed!
    }

    /**
     * Whether this poll is public, i.e. you
     * list of voters is publicly available
     */
    get isPublic(): boolean {
        return this.raw.publicVoters!
    }

    /**
     * Whether this is a quiz
     */
    get isQuiz(): boolean {
        return this.raw.quiz!
    }

    /**
     * Whether this poll accepts multiple answers
     */
    get isMultiple(): boolean {
        return this.raw.multipleChoice!
    }

    /**
     * Solution for the quiz, only available
     * in case you have already answered
     */
    get solution(): string | null {
        return this.results?.solution ?? null
    }

    /**
     * Format entities for {@link solution}, only available
     * in case you have already answered
     */
    get solutionEntities(): ReadonlyArray<MessageEntity> | null {
        if (!this.results) return null

        const res: MessageEntity[] = []

        if (this.results.solutionEntities?.length) {
            for (const ent of this.results.solutionEntities) {
                res.push(new MessageEntity(ent, this.results.solution))
            }
        }

        return res
    }

    /**
     * Input media TL object generated from this object,
     * to be used inside {@link InputMediaLike} and
     * {@link TelegramClient.sendMedia}
     *
     * A few notes:
     *  - Using this will result in an
     *    independent poll, which will not
     *    be auto-updated with the current.
     *  - If this is a quiz, a normal poll
     *    will be returned since the client does not
     *    know the correct answer.
     *  - This always returns a non-closed poll,
     *    even if the current poll was closed
     */
    get inputMedia(): tl.TypeInputMedia {
        return {
            _: 'inputMediaPoll',
            poll: {
                _: 'poll',
                closed: false,
                id: Long.ZERO,
                publicVoters: this.raw.publicVoters,
                multipleChoice: this.raw.multipleChoice,
                question: this.raw.question,
                answers: this.raw.answers,
                closePeriod: this.raw.closePeriod,
                closeDate: this.raw.closeDate,
            },
        }
    }
}

memoizeGetters(Poll, ['answers', 'solutionEntities'])
makeInspectable(Poll, undefined, ['inputMedia'])
