import { describe, expect, it } from 'vitest'

import { StubTelegramClient } from '@mtcute/test'

import { sleep } from '../../utils/misc-utils.js'
import { ITelegramClient } from '../client.types.js'
import { batchedQuery } from './query-batcher.js'

describe('batchedQuery', () => {
    const client = new StubTelegramClient()
    client.log.prefix = '[1]'

    it('should correctly batch requests', async () => {
        const log: string[] = []

        const fetch = async (client: ITelegramClient, items: number[]) => {
            log.push(`[start] fetch() ${items.join(', ')}`)

            await sleep(10)

            log.push(`[end] fetch() ${items.join(', ')}`)

            return items.map((it) => it * 2)
        }

        const batched = batchedQuery({
            fetch,
            inputKey: (it) => it,
            outputKey: (it) => it / 2,
        })

        const batchedWrapped = async (item: number) => {
            log.push(`[start] batched() ${item}`)

            const res = await batched(client, item)

            log.push(`[end] batched() ${item} => ${res}`)

            return res
        }

        const results = await Promise.all([
            batchedWrapped(1),
            batchedWrapped(2),
            batchedWrapped(3),
            batchedWrapped(3),
            batchedWrapped(4),
        ])
        const results2 = await Promise.all([batchedWrapped(4), batchedWrapped(5), batchedWrapped(6)])

        expect(results).toEqual([2, 4, 6, 6, 8])
        expect(results2).toEqual([8, 10, 12])
        expect(log).toMatchInlineSnapshot(`
          [
            "[start] batched() 1",
            "[start] fetch() 1",
            "[start] batched() 2",
            "[start] batched() 3",
            "[start] batched() 3",
            "[start] batched() 4",
            "[end] fetch() 1",
            "[end] batched() 1 => 2",
            "[start] fetch() 2, 3, 4",
            "[end] fetch() 2, 3, 4",
            "[end] batched() 2 => 4",
            "[end] batched() 3 => 6",
            "[end] batched() 3 => 6",
            "[end] batched() 4 => 8",
            "[start] batched() 4",
            "[start] fetch() 4",
            "[start] batched() 5",
            "[start] batched() 6",
            "[end] fetch() 4",
            "[end] batched() 4 => 8",
            "[start] fetch() 5, 6",
            "[end] fetch() 5, 6",
            "[end] batched() 5 => 10",
            "[end] batched() 6 => 12",
          ]
        `)
    })

    it('should correctly limit batch size', async () => {
        const log: string[] = []

        const fetch = async (client: ITelegramClient, items: number[]) => {
            log.push(`[start] fetch() ${items.join(', ')}`)

            await sleep(10)

            log.push(`[end] fetch() ${items.join(', ')}`)

            return items.map((it) => it * 2)
        }

        const batched = batchedQuery({
            fetch,
            inputKey: (it) => it,
            outputKey: (it) => it / 2,
            maxBatchSize: 2,
        })

        const batchedWrapped = async (item: number) => {
            log.push(`[start] batched() ${item}`)

            const res = await batched(client, item)

            log.push(`[end] batched() ${item} => ${res}`)

            return res
        }

        const results = await Promise.all([
            batchedWrapped(1),
            batchedWrapped(2),
            batchedWrapped(3),
            batchedWrapped(3),
            batchedWrapped(4),
            batchedWrapped(5),
            batchedWrapped(6),
        ])
        const results2 = await Promise.all([batchedWrapped(6), batchedWrapped(7), batchedWrapped(8)])

        expect(results).toEqual([2, 4, 6, 6, 8, 10, 12])
        expect(results2).toEqual([12, 14, 16])
        expect(log).toMatchInlineSnapshot(`
          [
            "[start] batched() 1",
            "[start] fetch() 1",
            "[start] batched() 2",
            "[start] batched() 3",
            "[start] batched() 3",
            "[start] batched() 4",
            "[start] batched() 5",
            "[start] batched() 6",
            "[end] fetch() 1",
            "[end] batched() 1 => 2",
            "[start] fetch() 2, 3",
            "[end] fetch() 2, 3",
            "[end] batched() 2 => 4",
            "[end] batched() 3 => 6",
            "[end] batched() 3 => 6",
            "[start] fetch() 4, 5",
            "[end] fetch() 4, 5",
            "[end] batched() 4 => 8",
            "[end] batched() 5 => 10",
            "[start] fetch() 6",
            "[end] fetch() 6",
            "[end] batched() 6 => 12",
            "[start] batched() 6",
            "[start] fetch() 6",
            "[start] batched() 7",
            "[start] batched() 8",
            "[end] fetch() 6",
            "[end] batched() 6 => 12",
            "[start] fetch() 7, 8",
            "[end] fetch() 7, 8",
            "[end] batched() 7 => 14",
            "[end] batched() 8 => 16",
          ]
        `)
    })

    it('should correctly do concurrent requests', async () => {
        const log: string[] = []

        const fetch = async (client: ITelegramClient, items: number[]) => {
            log.push(`[start] fetch() ${items.join(', ')}`)

            await sleep(10)

            log.push(`[end] fetch() ${items.join(', ')}`)

            return items.map((it) => it * 2)
        }

        const batched = batchedQuery({
            fetch,
            inputKey: (it) => it,
            outputKey: (it) => it / 2,
            maxBatchSize: 2,
            maxConcurrent: 2,
        })

        const batchedWrapped = async (item: number) => {
            log.push(`[start] batched() ${item}`)

            const res = await batched(client, item)

            log.push(`[end] batched() ${item} => ${res}`)

            return res
        }

        const results = await Promise.all([
            batchedWrapped(1),
            batchedWrapped(2),
            batchedWrapped(3),
            batchedWrapped(3),
            batchedWrapped(4),
            batchedWrapped(5),
            batchedWrapped(6),
        ])
        const results2 = await Promise.all([batchedWrapped(6), batchedWrapped(7), batchedWrapped(8)])

        expect(results).toEqual([2, 4, 6, 6, 8, 10, 12])
        expect(results2).toEqual([12, 14, 16])
        expect(log).toMatchInlineSnapshot(`
          [
            "[start] batched() 1",
            "[start] fetch() 1",
            "[start] batched() 2",
            "[start] fetch() 2",
            "[start] batched() 3",
            "[start] batched() 3",
            "[start] batched() 4",
            "[start] batched() 5",
            "[start] batched() 6",
            "[end] fetch() 1",
            "[end] batched() 1 => 2",
            "[start] fetch() 3, 4",
            "[end] fetch() 2",
            "[end] batched() 2 => 4",
            "[start] fetch() 5, 6",
            "[end] fetch() 3, 4",
            "[end] batched() 3 => 6",
            "[end] batched() 3 => 6",
            "[end] batched() 4 => 8",
            "[end] fetch() 5, 6",
            "[end] batched() 5 => 10",
            "[end] batched() 6 => 12",
            "[start] batched() 6",
            "[start] fetch() 6",
            "[start] batched() 7",
            "[start] fetch() 7",
            "[start] batched() 8",
            "[end] fetch() 6",
            "[end] batched() 6 => 12",
            "[start] fetch() 8",
            "[end] fetch() 7",
            "[end] batched() 7 => 14",
            "[end] fetch() 8",
            "[end] batched() 8 => 16",
          ]
        `)
    })

    it('should correctly handle errors', async () => {
        const log: string[] = []

        const fetch = async (client: ITelegramClient, items: number[]) => {
            log.push(`[start] fetch() ${items.join(', ')}`)

            await sleep(10)

            if (items.includes(2)) {
                log.push(`[error] fetch() ${items.join(', ')}`)
                throw new Error('test')
            }

            log.push(`[end] fetch() ${items.join(', ')}`)

            return items.map((it) => it * 2)
        }

        const batched = batchedQuery({
            fetch,
            inputKey: (it) => it,
            outputKey: (it) => it / 2,
            maxBatchSize: 2,
        })

        const batchedWrapped = async (item: number) => {
            log.push(`[start] batched() ${item}`)

            let res

            try {
                res = await batched(client, item)
            } catch (e) {
                log.push(`[error] batched() ${item} => ${(e as Error).message}`)

                return null
            }

            log.push(`[end] batched() ${item} => ${res}`)

            return res
        }

        const res = await Promise.all([batchedWrapped(1), batchedWrapped(2), batchedWrapped(3)])

        // second batch will fail entirely because of an error in one of the items.
        expect(res).toEqual([2, null, null])
        expect(log).toMatchInlineSnapshot(`
          [
            "[start] batched() 1",
            "[start] fetch() 1",
            "[start] batched() 2",
            "[start] batched() 3",
            "[end] fetch() 1",
            "[end] batched() 1 => 2",
            "[start] fetch() 2, 3",
            "[error] fetch() 2, 3",
            "[error] batched() 2 => test",
            "[error] batched() 3 => test",
          ]
        `)
    })

    it('should not share state across clients', async () => {
        const client2 = new StubTelegramClient()
        client2.log.prefix = '[2]'

        const log: string[] = []

        const fetch = async (client: ITelegramClient, items: number[]) => {
            log.push(`[start] ${client.log.prefix} fetch() ${items.join(', ')}`)

            await sleep(10)

            log.push(`[end] ${client.log.prefix} fetch() ${items.join(', ')}`)

            return items.map((it) => it * 2)
        }

        const batched = batchedQuery({
            fetch,
            inputKey: (it) => it,
            outputKey: (it) => it / 2,
        })

        const batchedWrapped = async (item: number, client_ = client) => {
            log.push(`[start] ${client_.log.prefix} batched() ${item}`)

            const res = await batched(client_, item)

            log.push(`[end] ${client_.log.prefix} batched() ${item} => ${res}`)

            return res
        }

        const results = await Promise.all([
            batchedWrapped(1),
            batchedWrapped(2),
            batchedWrapped(3),
            batchedWrapped(3, client2),
            batchedWrapped(4, client2),
            batchedWrapped(5),
            batchedWrapped(6, client2),
        ])
        const results2 = await Promise.all([batchedWrapped(6, client2), batchedWrapped(7), batchedWrapped(8, client2)])

        expect(results).toEqual([2, 4, 6, 6, 8, 10, 12])
        expect(results2).toEqual([12, 14, 16])

        expect(log).toMatchInlineSnapshot(`
          [
            "[start] [1] batched() 1",
            "[start] [1] fetch() 1",
            "[start] [1] batched() 2",
            "[start] [1] batched() 3",
            "[start] [2] batched() 3",
            "[start] [2] fetch() 3",
            "[start] [2] batched() 4",
            "[start] [1] batched() 5",
            "[start] [2] batched() 6",
            "[end] [1] fetch() 1",
            "[end] [1] batched() 1 => 2",
            "[start] [1] fetch() 2, 3, 5",
            "[end] [2] fetch() 3",
            "[end] [2] batched() 3 => 6",
            "[start] [2] fetch() 4, 6",
            "[end] [1] fetch() 2, 3, 5",
            "[end] [1] batched() 2 => 4",
            "[end] [1] batched() 3 => 6",
            "[end] [1] batched() 5 => 10",
            "[end] [2] fetch() 4, 6",
            "[end] [2] batched() 4 => 8",
            "[end] [2] batched() 6 => 12",
            "[start] [2] batched() 6",
            "[start] [2] fetch() 6",
            "[start] [1] batched() 7",
            "[start] [1] fetch() 7",
            "[start] [2] batched() 8",
            "[end] [2] fetch() 6",
            "[end] [2] batched() 6 => 12",
            "[start] [2] fetch() 8",
            "[end] [1] fetch() 7",
            "[end] [1] batched() 7 => 14",
            "[end] [2] fetch() 8",
            "[end] [2] batched() 8 => 16",
          ]
        `)
    })

    it('should correctly handle fetcher omitting some items', async () => {
        const log: string[] = []

        const fetch = async (client: ITelegramClient, items: number[]) => {
            log.push(`[start] fetch() ${items.join(', ')}`)

            await sleep(10)

            log.push(`[end] fetch() ${items.join(', ')}`)

            return items.filter((it) => it !== 6).map((it) => it * 2)
        }

        const batched = batchedQuery({
            fetch,
            inputKey: (it) => it,
            outputKey: (it) => it / 2,
        })

        const batchedWrapped = async (item: number) => {
            log.push(`[start] batched() ${item}`)

            const res = await batched(client, item)

            log.push(`[end] batched() ${item} => ${res}`)

            return res
        }

        const results = await Promise.all([
            batchedWrapped(1),
            batchedWrapped(2),
            batchedWrapped(3),
            batchedWrapped(3),
            batchedWrapped(4),
            batchedWrapped(5),
            batchedWrapped(6),
        ])
        const results2 = await Promise.all([batchedWrapped(6), batchedWrapped(7), batchedWrapped(8)])

        expect(results).toEqual([2, 4, 6, 6, 8, 10, null])
        expect(results2).toEqual([null, 14, 16])
        expect(log).toMatchInlineSnapshot(`
          [
            "[start] batched() 1",
            "[start] fetch() 1",
            "[start] batched() 2",
            "[start] batched() 3",
            "[start] batched() 3",
            "[start] batched() 4",
            "[start] batched() 5",
            "[start] batched() 6",
            "[end] fetch() 1",
            "[end] batched() 1 => 2",
            "[start] fetch() 2, 3, 4, 5, 6",
            "[end] fetch() 2, 3, 4, 5, 6",
            "[end] batched() 2 => 4",
            "[end] batched() 3 => 6",
            "[end] batched() 3 => 6",
            "[end] batched() 4 => 8",
            "[end] batched() 5 => 10",
            "[end] batched() 6 => null",
            "[start] batched() 6",
            "[start] fetch() 6",
            "[start] batched() 7",
            "[start] batched() 8",
            "[end] fetch() 6",
            "[end] batched() 6 => null",
            "[start] fetch() 7, 8",
            "[end] fetch() 7, 8",
            "[end] batched() 7 => 14",
            "[end] batched() 8 => 16",
          ]
        `)
    })

    it('should correctly retry failed batches one by one entirely', async () => {
        const log: string[] = []

        const fetch = async (client: ITelegramClient, items: number[]) => {
            log.push(`[start] fetch() ${items.join(', ')}`)

            await sleep(10)

            if (items.includes(2)) {
                log.push(`[error] fetch() ${items.join(', ')}`)
                throw new Error('test')
            }

            log.push(`[end] fetch() ${items.join(', ')}`)

            return items.map((it) => it * 2)
        }

        const batched = batchedQuery({
            fetch,
            inputKey: (it) => it,
            outputKey: (it) => it / 2,
            maxBatchSize: 2,
            retrySingleOnError: () => true,
        })

        const batchedWrapped = async (item: number) => {
            log.push(`[start] batched() ${item}`)

            let res

            try {
                res = await batched(client, item)
            } catch (e) {
                log.push(`[error] batched() ${item} => ${(e as Error).message}`)

                return null
            }

            log.push(`[end] batched() ${item} => ${res}`)

            return res
        }

        const res = await Promise.all([batchedWrapped(1), batchedWrapped(2), batchedWrapped(3)])

        expect(res).toEqual([2, null, 6])
        expect(log).toMatchInlineSnapshot(`
          [
            "[start] batched() 1",
            "[start] fetch() 1",
            "[start] batched() 2",
            "[start] batched() 3",
            "[end] fetch() 1",
            "[end] batched() 1 => 2",
            "[start] fetch() 2, 3",
            "[error] fetch() 2, 3",
            "[start] fetch() 2",
            "[error] fetch() 2",
            "[error] batched() 2 => test",
            "[start] fetch() 3",
            "[end] fetch() 3",
            "[end] batched() 3 => 6",
          ]
        `)
    })

    it('should correctly retry failed batches one by one partially', async () => {
        const log: string[] = []

        const fetch = async (client: ITelegramClient, items: number[]) => {
            log.push(`[start] fetch() ${items.join(', ')}`)

            await sleep(10)

            if (items.includes(2) || items.includes(4)) {
                log.push(`[error] fetch() ${items.join(', ')}`)
                throw new Error('test')
            }

            log.push(`[end] fetch() ${items.join(', ')}`)

            return items.map((it) => it * 2)
        }

        const batched = batchedQuery({
            fetch,
            inputKey: (it) => it,
            outputKey: (it) => it / 2,
            retrySingleOnError: () => [3, 4],
        })

        const batchedWrapped = async (item: number) => {
            log.push(`[start] batched() ${item}`)

            let res

            try {
                res = await batched(client, item)
            } catch (e) {
                log.push(`[error] batched() ${item} => ${(e as Error).message}`)

                return null
            }

            log.push(`[end] batched() ${item} => ${res}`)

            return res
        }

        const res = await Promise.all([batchedWrapped(1), batchedWrapped(2), batchedWrapped(3), batchedWrapped(4)])

        expect(res).toEqual([2, null, 6, null])
        expect(log).toMatchInlineSnapshot(`
          [
            "[start] batched() 1",
            "[start] fetch() 1",
            "[start] batched() 2",
            "[start] batched() 3",
            "[start] batched() 4",
            "[end] fetch() 1",
            "[end] batched() 1 => 2",
            "[start] fetch() 2, 3, 4",
            "[error] fetch() 2, 3, 4",
            "[error] batched() 2 => test",
            "[start] fetch() 3",
            "[end] fetch() 3",
            "[end] batched() 3 => 6",
            "[start] fetch() 4",
            "[error] fetch() 4",
            "[error] batched() 4 => test",
          ]
        `)
    })
})
