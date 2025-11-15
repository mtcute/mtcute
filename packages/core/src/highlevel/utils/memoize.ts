/* eslint-disable ts/no-unsafe-return,ts/no-unsafe-assignment */

export function memoizeGetters<T>(cls: new (...args: any[]) => T, fields: (keyof T)[]): typeof cls {
  for (const field of fields) {
    const desc = Object.getOwnPropertyDescriptor(cls.prototype, field)
    if (!desc) continue

    const { get } = desc

    if (!get) continue

    Object.defineProperty(cls.prototype, field, {
      get() {
        const val = get.call(this)
        Object.defineProperty(this, field, {
          value: val,
          enumerable: true,
          writable: true,
        })

        return val
      },
      enumerable: true,
      configurable: true,
    })
  }

  return cls
}
