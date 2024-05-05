import { tl } from '@mtcute/tl'

import { assertTrue } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { BusinessWorkHoursDay, businessWorkHoursDaysToRaw } from '../../types/premium/business-work-hours.js'

// @available=user
/**
 * Set current user's business work hours.
 */
export async function setBusinessWorkHours(
    client: ITelegramClient,
    params:
        | ({
              /** Timezone in which the hours are defined */
              timezone: string
          } & (
              | {
                    /**
                     * Business work intervals, per-day (like available in {@link BusinessWorkHours.days})
                     */
                    hours: ReadonlyArray<BusinessWorkHoursDay>
                }
              | {
                    /** Business work intervals, raw intervals */
                    intervals: tl.TypeBusinessWeeklyOpen[]
                }
          ))
        | null,
): Promise<void> {
    let businessWorkHours: tl.TypeBusinessWorkHours | undefined = undefined

    if (params) {
        let weeklyOpen: tl.TypeBusinessWeeklyOpen[]

        if ('hours' in params) {
            weeklyOpen = businessWorkHoursDaysToRaw(params.hours)
        } else {
            weeklyOpen = params.intervals
        }

        businessWorkHours = {
            _: 'businessWorkHours',
            timezoneId: params.timezone,
            weeklyOpen,
        }
    }

    const res = await client.call({
        _: 'account.updateBusinessWorkHours',
        businessWorkHours,
    })

    assertTrue('account.updateBusinessWorkHours', res)
}
