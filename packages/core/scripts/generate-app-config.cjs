const fs = require('fs')
const path = require('path')

const spec = require('@mtcute/tl/app-config.json')

const OUT_FILE = path.join(__dirname, '../src/highlevel/types/misc/app-config.ts')

const out = fs.createWriteStream(OUT_FILE)
out.write(`// This file is generated automatically, do not modify!
/* eslint-disable */

export interface AppConfigSchema {
`)

const indent = (str) => str.split('\n').map((x) => '    ' + x).join('\n')

for (const [key, { type, description }] of Object.entries(spec)) {
    out.write(indent(description) + '\n')
    out.write(indent(`${key}?: ${type}`) + '\n')
}

out.write('    [key: string]: unknown\n')
out.write('}\n')

out.close()
