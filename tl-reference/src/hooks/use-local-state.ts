import { useState } from 'react'

export function useLocalState<T>(key: string, init: T): [T, (val: T) => void] {
    const local = typeof localStorage !== 'undefined' ? localStorage[key] : undefined
    const [item, setItem] = useState<T>(local ? JSON.parse(local) : init)

    return [
        item,
        (val: T) => {
            setItem(val)
            localStorage[key] = JSON.stringify(val)
        }
    ]
}
