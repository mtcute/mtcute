import { tl } from '@mtcute/tl'

import type { StubTelegramClient } from './client.js'

export type Responder<Method extends tl.RpcMethod['_']> = [
    Method,
    (req: tl.FindByName<tl.RpcMethod, Method>) => tl.RpcCallReturn[Method],
]
export type ResponderFactory<Method extends tl.RpcMethod['_']> = (client: StubTelegramClient) => Responder<Method>
export type InputResponder<Method extends tl.RpcMethod['_']> =
    | Responder<Method>
    | ResponderFactory<Method>
    | InputResponder<Method>[]
