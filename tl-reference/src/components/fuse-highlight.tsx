import Fuse from 'fuse.js'
import React from 'react'

function highlight(
    value: string,
    ranges: ReadonlyArray<Fuse.RangeTuple>,
    className: string,
    pos = ranges.length
): React.ReactElement {
    const pair = ranges[pos - 1]

    return pair ? (
        <>
            {highlight(value.substring(0, pair[0]), ranges, className, pos - 1)}
            <span className={className}>
                {value.substring(pair[0], pair[1] + 1)}
            </span>
            {value.substring(pair[1] + 1)}
        </>
    ) : (
        <span>{value}</span>
    )
}

export function FuseHighlight({
    matches,
    value,
    className,
}: {
    matches: ReadonlyArray<Fuse.FuseResultMatch>
    value: string
    className: string
}): React.ReactElement {
    return highlight(value, matches![0].indices, className)
}
