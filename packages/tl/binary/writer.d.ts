declare const __tlWriterMap: Record<string, (w: unknown, val: unknown) => void> & {
    _bare: Record<number, (r: unknown) => unknown>
}
// eslint-disable-next-line import/no-default-export
export default __tlWriterMap
