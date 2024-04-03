import { PublicPart } from '../../types/utils.js'
import { AppConfigManager } from '../managers/app-config-manager.js'
import { WorkerInvoker } from './invoker.js'

export class AppConfigManagerProxy implements PublicPart<AppConfigManager> {
    readonly get: AppConfigManager['get']
    readonly getField

    constructor(readonly invoker: WorkerInvoker) {
        const bind = invoker.makeBinder<AppConfigManager>('app-config')

        this.get = bind('get')
        this.getField = bind('getField')
    }
}
