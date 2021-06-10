export interface ExtendedTlObject {
    id: string
    tlId: number
    ts: string
    prefix: string
    available: 'user' | 'bot' | 'both'
    type: 'union' | 'class' | 'method'
    name: string
    namespace: string
    returns: string
    underscore: string
    description: string | null
    descriptionExcerpt: string
    arguments: {
        ts: string
        optional?: boolean
        name: string
        type: string
        predicate: string
        description: string | null

        changed?: 'added' | 'modified' | 'removed'
        className?: string
    }[]
    throws: {
        name: string
        code: string
        description: string
    }[]
    subtypes: string[]
}

export interface GraphqlAllResponse<T> {
    edges: {
        node: T
    }[]
}
