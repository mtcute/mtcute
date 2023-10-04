import { MtTypeAssertionError } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { StoriesStealthMode } from '../../types/stories/stealth-mode'
import { assertIsUpdatesGroup, hasValueAtKey } from '../../utils'

/**
 * Hide own stories views (activate so called "stealth mode")
 *
 * Currently has a cooldown of 1 hour, and throws FLOOD_WAIT error if it is on cooldown.
 *
 * @internal
 */
export async function hideMyStoriesViews(
    this: TelegramClient,
    params?: {
        /**
         * Whether to hide views from the last 5 minutes
         *
         * @default  true
         */
        past?: boolean

        /**
         * Whether to hide views for the next 25 minutes
         *
         * @default  true
         */
        future?: boolean
    },
): Promise<StoriesStealthMode> {
    const { past = true, future = true } = params ?? {}

    const res = await this.call({
        _: 'stories.activateStealthMode',
        past,
        future,
    })

    assertIsUpdatesGroup('hideMyStoriesViews', res)
    this._handleUpdate(res, true)

    const upd = res.updates.find(hasValueAtKey('_', 'updateStoriesStealthMode'))

    if (!upd) { throw new MtTypeAssertionError('hideMyStoriesViews (@ res.updates[*])', 'updateStoriesStealthMode', 'none') }

    return new StoriesStealthMode(upd.stealthMode)
}
