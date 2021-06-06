export const isTouchDevice = function (): boolean {
    // because windows touch support stinks
    if (navigator.userAgent.match(/Windows NT/i)) return false;

    const prefixes = ' -webkit- -moz- -o- -ms- '.split(' ')

    const mq = function (query: string): boolean {
        return window.matchMedia(query).matches
    }

    if ('ontouchstart' in window
        || (navigator.maxTouchPoints > 0)
        || (navigator.msMaxTouchPoints > 0)
        || (window as any).DocumentTouch && document instanceof (window as any).DocumentTouch) {
        return true
    }

    const query = prefixes.map(i => `(${i}touch-enabled)`).join(',')
    return mq(query)
}

export const hexConstructorId = (id: number): string => {
    return '0x' + id.toString(16).padStart(8, '0')
}
