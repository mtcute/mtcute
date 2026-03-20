export function parseBigint(value: string | number): number {
  return typeof value === 'string' ? Number(value) : value
}

export function parseJsonb<T>(value: unknown): T {
  // eslint-disable-next-line ts/no-unsafe-return
  return typeof value === 'string' ? JSON.parse(value) : value as T
}
