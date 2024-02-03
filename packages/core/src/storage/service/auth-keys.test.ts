import { describe, expect, it, vi } from 'vitest'

import { fakeAuthKeysRepository, fakeKeyValueRepository } from '@mtcute/test'

import { AuthKeysService } from './auth-keys.js'
import { FutureSaltsService } from './future-salts.js'
import { testServiceOptions } from './utils.test-utils.js'

describe('auth keys service', () => {
    const fakeKeys = fakeAuthKeysRepository()
    const fakeKv = fakeKeyValueRepository()

    describe('deleteByDc', () => {
        it('should delete keys and salts for given DC', async () => {
            const saltsService = new FutureSaltsService(fakeKv, testServiceOptions())
            const service = new AuthKeysService(fakeKeys, saltsService, testServiceOptions())

            vi.spyOn(saltsService, 'delete')

            await service.deleteByDc(2)

            expect(fakeKeys.deleteByDc).toHaveBeenCalledWith(2)
            expect(saltsService.delete).toHaveBeenCalledWith(2)
        })
    })
})
