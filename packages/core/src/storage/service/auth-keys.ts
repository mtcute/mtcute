import { IAuthKeysRepository } from '../repository/auth-keys.js'
import { BaseService, ServiceOptions } from './base.js'
import { FutureSaltsService } from './future-salts.js'

export class AuthKeysService extends BaseService {
    constructor(
        readonly _keys: IAuthKeysRepository,
        readonly _salts: FutureSaltsService,
        opts: ServiceOptions,
    ) {
        super(opts)
    }

    async deleteByDc(dc: number): Promise<void> {
        await this._keys.deleteByDc(dc)
        await this._salts.delete(dc)
    }
}
