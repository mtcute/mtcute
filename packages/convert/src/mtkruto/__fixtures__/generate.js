/* eslint-disable import/no-unresolved, no-undef, no-console */

import { Client, StorageMemory } from 'https://deno.land/x/mtkruto@0.1.157/mod.ts'

const client = new Client(new StorageMemory(), Number(Deno.env.get('API_ID')), Deno.env.get('API_HASH'), {
    initialDc: '2-test',
})

await client.start({
    phone: () => '9996621234',
    code: () => '22222',
})

const authString = await client.exportAuthString()
console.log('The auth string is', authString)
