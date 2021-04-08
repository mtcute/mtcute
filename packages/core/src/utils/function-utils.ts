export function debounce<T extends Function>(
    func: T,
    delay: number
): () => void {
    let timeout: NodeJS.Timeout | null
    return function (this: any) {
        const self = this
        const args = arguments
        const later = function (): void {
            timeout = null
            func.apply(self, args)
        }
        if (timeout) {
            clearTimeout(timeout)
        }
        timeout = setTimeout(later, delay)
    } as any
}
