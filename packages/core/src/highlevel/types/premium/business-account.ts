import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { BusinessIntro } from './business-intro.js'
import { BusinessLocation } from './business-location.js'
import { BusinessWorkHours } from './business-work-hours.js'

/** Information about a business account */
export class BusinessAccount {
    constructor(readonly info: tl.RawUserFull) {}

    /** Introduction of the business account */
    get intro(): BusinessIntro | null {
        if (!this.info.businessIntro) return null

        return new BusinessIntro(this.info.businessIntro)
    }

    /** Work hours of the business */
    get workHours(): BusinessWorkHours | null {
        if (!this.info.businessWorkHours) return null

        return new BusinessWorkHours(this.info.businessWorkHours)
    }

    /** Location of the business */
    get location(): BusinessLocation | null {
        if (!this.info.businessLocation) return null

        return new BusinessLocation(this.info.businessLocation)
    }

    /** Information about a greeting message */
    get greetingMessage(): tl.TypeBusinessGreetingMessage | null {
        return this.info.businessGreetingMessage ?? null
    }

    /** Information about an "away" message */
    get awayMessage(): tl.TypeBusinessAwayMessage | null {
        return this.info.businessAwayMessage ?? null
    }
}

memoizeGetters(BusinessAccount, ['intro', 'workHours', 'location'])
makeInspectable(BusinessAccount)
