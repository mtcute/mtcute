import { TelegramClient } from '../../client'
import { tl } from '@mtcute/tl'

const debug = require('debug')('mtcute:upds')

/**
 * Catch up with the server by loading missed updates.
 *
 * @internal
 */
export async function catchUp(this: TelegramClient): Promise<void> {
    // this doesn't work with missed channel updates properly
    // todo: fix
    const state = await this.storage.getCommonPts()
    if (!state) return

    let [pts, date] = state

    let error: Error | null = null
    try {
        for (;;) {
            const diff = await this.call({
                _: 'updates.getDifference',
                pts,
                date,
                qts: 0,
            })

            if (
                diff._ === 'updates.difference' ||
                diff._ === 'updates.differenceSlice'
            ) {
                const state =
                    diff._ === 'updates.difference'
                        ? diff.state
                        : diff.intermediateState
                pts = state.pts
                date = state.date

                this._handleUpdate({
                    _: 'updates',
                    users: diff.users,
                    chats: diff.chats,
                    date: state.date,
                    seq: state.seq,
                    updates: [
                        ...diff.otherUpdates,
                        ...diff.newMessages.map(
                            (m) =>
                                ({
                                    _: 'updateNewMessage',
                                    message: m,
                                    pts: 0,
                                    ptsCount: 0,
                                } as tl.RawUpdateNewMessage)
                        ),
                    ],
                })

                debug(
                    'catching up... processed %d updates and %d messages',
                    diff.otherUpdates.length,
                    diff.newMessages.length
                )
            } else {
                if (diff._ === 'updates.differenceEmpty') {
                    date = diff.date
                } else if (diff._ === 'updates.differenceTooLong') {
                    pts = diff.pts
                }
                break
            }
        }
    } catch (e) {
        error = e
        debug('error while catching up: ' + error)
    }

    debug('caught up')

    await this.storage.setCommonPts([pts, date])
    await this.storage.save?.()
}
