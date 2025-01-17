# Child Dispatchers

Child dispatchers is an elegant way to divide logic in your application.

Child dispatcher is an isolated dispatcher with its own dispatcher groups,
propagation and handlers that do not interfere with other dispatchers (the only
exception being `StopChildrenPropagation`)

## Creating a child

```ts
const child = Dispatcher.child()
```

Then you can register your handlers to `child`.

## Adding a child

Dispatcher on its own does nothing, it needs to be bound to a parent
to become a child dispatcher. That is done simply by calling `addChild`:

```ts
dp.addChild(child)
```

Only dispatchers that are not bound to a Client can be used as a child.
This also means that a dispatcher can only be a child to one dispatcher,
i.e. the following code **will not work**:

```ts
dp.addChild(child)
otherDp.addChild(child) // error!
```

However, you can use `.clone()` method to make this work:

```ts
dp.addChild(child)
otherDp.addChild(child.clone()) // ok
```

## Removing a child

When building some kind of modular architecture, it is useful to also
remove a child dispatcher. Luckily, it is just as easy:

```ts
dp.removeChild(child)
```

Do note, however, that if you are using a cloned dispatcher,
calling `removeChild` on the original dispatcher will do nothing.
Instead, you have to store the reference to the cloned dispatcher:

```ts
const childClone = child.clone()
otherDp.addChild(childClone)

// later
otherDp.removeChild(childClone)
```

## Extending

Instead of using child dispatchers, you can extend the existing dispatcher
with another one:

```ts
dp.extend(child)
```

Note that in this case, `child` **will not** be isolated, and its handler
groups, children, scenes, etc. will be merged to the original dispatcher.
If `child` contains scenes with already registered names, they will be
overwritten.

Extending will not work if the child is using a custom storage or
a custom key delegate.

Using a dispatcher after it was `.extend()`-ed into another dispatcher
is undefined behaviour and should be avoided.
