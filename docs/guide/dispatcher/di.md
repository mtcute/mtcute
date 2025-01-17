# Dependency Injection

When scaling up your bot to multiple files, you may find it useful to inject dependencies
into the children dispatchers instead of having to pass them around manually.

`@mtcute/dispatcher` provides a simple service locator that you can use to inject dependencies:

```ts
// for typescript, you need to declare the dependencies
declare module '@mtcute/dispatcher' {
    interface DispatcherDependencies {
        db: Database
    }
}

// create a root dispatcher
const dp = Dispatcher.for(tg)

// inject the database
dp.inject('db', new Database())
// or 
dp.inject({ db: new Database() })

// and then add a child dispatcher
import { childDispatcher } from './file2'
dp.addChild(childDispatcher)

// file2.ts
const dp = Dispatcher.child()

dp.onNewMessage(async (ctx) => {
    // the dependencies are available in dp.deps
    const db = dp.deps.db
    await db.saveMessage(ctx.message)
})

export const childDispatcher = dp
```

::: info
You can only inject dependencies into the root dispatcher (the one created with `Dispatcher.for`),
and they will be available in *all* children dispatchers.
:::