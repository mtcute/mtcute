import type { tl } from '../../../tl/index.js'
import type { MessageMedia } from '../messages/message-media.js'

import type { PeersIndex } from '../peers/peers-index.js'
import Long from 'long'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { MessageEntity } from '../messages/message-entity.js'
import { _messageMediaFromTl } from '../messages/message-media.js'

export class PollAnswer {
  constructor(
    readonly raw: tl.RawPollAnswer,
    readonly result?: tl.RawPollAnswerVoters | undefined,
  ) {}

  /**
   * Answer text
   */
  get text(): string {
    return this.raw.text.text
  }

  /**
   * Format entities for {@link text}, currently may only contain custom emojis
   */
  get textEntities(): ReadonlyArray<MessageEntity> {
    return this.raw.text.entities.map(ent => new MessageEntity(ent, this.raw.text.text))
  }

  /**
   * Answer data, to be passed to
   * {@link TelegramClient.sendVote}
   */
  get data(): Uint8Array {
    return this.raw.option
  }

  /**
   * Number of people who has chosen this result.
   * If not available (i.e. not voted yet)
   *
   * @default
   */
  get voters(): number {
    return this.result?.voters ?? 0
  }

  /**
   * Whether this answer was chosen by the current user
   */
  get chosen(): boolean {
    return Boolean(this.result?.chosen)
  }

  /**
   * Whether this answer is correct (for quizzes).
   * Not available before choosing an answer
   *
   * @default
   */
  get correct(): boolean {
    return Boolean(this.result?.correct)
  }

  /** Media attached to this answer, if any */
  get media(): MessageMedia | null {
    return this.raw.media ? _messageMediaFromTl(null, this.raw.media) : null
  }
}

memoizeGetters(PollAnswer, ['textEntities', 'media'])
makeInspectable(PollAnswer)

export class Poll {
  readonly type = 'poll' as const

  constructor(
    readonly raw: tl.TypePoll,
    readonly _peers: PeersIndex,
    readonly results?: tl.RawPollResults | undefined,
    readonly attachedMedia?: MessageMedia | undefined,
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
    return this.raw.question.text
  }

  /**
   * Format entities for {@link question} (currently may only contain custom emojis)
   */
  get questionEntities(): ReadonlyArray<MessageEntity> {
    return this.raw.question.entities.map(ent => new MessageEntity(ent, this.raw.question.text))
  }

  /**
   * List of answers in this poll
   */
  get answers(): ReadonlyArray<PollAnswer> {
    const results = this.results?.results

    return this.raw.answers.map((ans, idx) => {
      assertTypeIs('Poll.answers', ans, 'pollAnswer')
      if (results) {
        return new PollAnswer(ans, results[idx])
      }

      return new PollAnswer(ans)
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

  /** Whether the current user is the creator of this poll */
  get isCreator(): boolean {
    return this.raw.creator!
  }

  /** Whether new options can be suggested to this poll */
  get canAddAnswers(): boolean {
    return !this.raw.closed && !this.raw.openAnswers
  }

  /** Whether retracting the vote is disabled in this poll */
  get isRevotingDisabled(): boolean {
    return this.raw.revotingDisabled!
  }

  /** Whether answers to this poll should be shuffled before showing to the user */
  get shuffleAnswers(): boolean {
    return this.raw.shuffleAnswers!
  }

  /** Whether the results of this poll are hidden until the end of the poll */
  get hideResultsUntilClose(): boolean {
    return this.raw.hideResultsUntilClose!
  }

  /** Whether the poll has unread votes */
  get hasUnreaVotes(): boolean {
    return this.results?.hasUnreadVotes ?? false
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

  /** Media attached to the solution, if any */
  get solutionMedia(): MessageMedia | null {
    return this.results?.solutionMedia ? _messageMediaFromTl(null, this.results.solutionMedia) : null
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
      attachedMedia: this.attachedMedia?.inputMedia,
      solutionMedia: this.solutionMedia?.inputMedia,
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
        openAnswers: this.raw.openAnswers,
        revotingDisabled: this.raw.revotingDisabled,
        shuffleAnswers: this.raw.shuffleAnswers,
        hideResultsUntilClose: this.raw.hideResultsUntilClose,
        hash: Long.ZERO,
      },
    }
  }
}

memoizeGetters(Poll, ['answers', 'solutionEntities', 'questionEntities', 'solutionMedia'])
makeInspectable(Poll, ['attachedMedia'], ['inputMedia'])
