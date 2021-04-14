import Fuse from 'fuse.js'
import { ChangeEvent, useCallback, useMemo, useState } from 'react'
import { debounce } from '@material-ui/core'

export function useFuse<T>(
    items: T[],
    options: Fuse.IFuseOptions<T>,
    searchOptions: Fuse.FuseSearchOptions,
    customFilter?: (it: T) => boolean
) {
    const [query, updateQuery] = useState('')

    const fuse = useMemo(() => new Fuse(items, options), [items, options])

    const hits = useMemo(() => {
        if (!query) return []
        let res = fuse.search(query, searchOptions)
        if (customFilter) res = res.filter((it) => customFilter(it.item))
        return res
    }, [
        fuse,
        query,
        options,
        searchOptions,
        customFilter
    ])

    const setQuery = useCallback(debounce(updateQuery, 100), [])

    const onSearch = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value),
        []
    )

    return {
        hits,
        onSearch,
        query,
        setQuery
    }
}
