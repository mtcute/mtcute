export interface INodeFsLike {
    readFile(path: string): Promise<Uint8Array>
    writeFile(path: string, data: Uint8Array): Promise<void>
    mkdir(path: string, options?: { recursive?: boolean }): Promise<void>
    stat(path: string): Promise<{ size: number, lastModified: number }>
}
