import { PublicPart } from '../../types/utils.js'
import { AppConfigManager } from '../managers/app-config-manager.js'
import { WorkerInvoker } from './invoker.js'

export class AppConfigManagerProxy implements PublicPart<AppConfigManager> {
    constructor(readonly invoker: WorkerInvoker) {}

    private _bind = this.invoker.makeBinder<AppConfigManager>('app-config')

    readonly get = this._bind('get')
    readonly getField = this._bind('getField')
}
