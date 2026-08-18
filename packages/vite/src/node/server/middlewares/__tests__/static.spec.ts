import { createServer as createHttpServer } from 'node:http'
import path from 'node:path'
import sirv from 'sirv'
import { describe, expect, onTestFinished, test } from 'vitest'
import { isFileInTargetPath } from '../static'

test('static files use weak comparison for If-None-Match', async () => {
  const root = path.resolve(import.meta.dirname, 'fixtures/root')
  const serve = sirv(root, { dev: true, etag: true })
  const server = createHttpServer(serve)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  onTestFinished(() => server.close())

  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Expected the test server to listen on a TCP port')
  }
  const url = `http://127.0.0.1:${address.port}/index.html`
  const initial = await fetch(url)
  const etag = initial.headers.get('etag')
  expect(etag).toMatch(/^W\//)

  const strongEtag = etag!.slice(2)
  for (const ifNoneMatch of [
    etag!,
    strongEtag,
    `"other,tag", ${strongEtag}`,
    '*',
  ]) {
    const response = await fetch(url, {
      headers: { 'If-None-Match': ifNoneMatch },
    })
    expect(response.status).toBe(304)
  }

  const nonMatching = await fetch(url, {
    headers: { 'If-None-Match': '"other"' },
  })
  expect(nonMatching.status).toBe(200)

  const malformed = await fetch(url, {
    headers: { 'If-None-Match': '"unterminated' },
  })
  expect(malformed.status).toBe(200)
})

describe('isFileInTargetPath', () => {
  const cases = {
    '/parent': {
      '/parent': true,
      '/parenta': false,
      '/parent/': true,
      '/parent/child': true,
      '/parent/child/child2': true,
    },
    '/parent/': {
      '/parent': false,
      '/parenta': false,
      '/parent/': true,
      '/parent/child': true,
      '/parent/child/child2': true,
    },
  }

  for (const [parent, children] of Object.entries(cases)) {
    for (const [child, expected] of Object.entries(children)) {
      test(`isFileInTargetPath("${parent}", "${child}")`, () => {
        expect(isFileInTargetPath(parent, child)).toBe(expected)
      })
    }
  }
})
