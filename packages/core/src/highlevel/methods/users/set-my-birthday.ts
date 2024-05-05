import { assertTrue } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'

// @available=user
/**
 * Set or remove current user's birthday.
 */
export async function setMyBirthday(
    client: ITelegramClient,
    birthday: {
        /** Birthday day */
        day: number
        /** Birthday month */
        month: number
        /** Birthday year (optional) */
        year?: number
    } | null,
): Promise<void> {
    const res = await client.call({
        _: 'account.updateBirthday',
        birthday: birthday ?
            {
                _: 'birthday',
                ...birthday,
            } :
            undefined,
    })

    assertTrue('account.updateBirthday', res)
}
