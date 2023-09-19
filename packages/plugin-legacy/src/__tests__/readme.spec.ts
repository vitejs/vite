import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'
import { cspHashes } from '..'

test('CSP hashes in README.md should be correct', () => {
  const readme = fs.readFileSync(
    path.resolve(__dirname, '../../README.md'),
    'utf-8',
  )
  const hashesInDoc = [...readme.matchAll(/`sha256-(.+)`/g)].map(
    (match) => match[1],
  )

  expect(hashesInDoc).toStrictEqual(cspHashes)
})
