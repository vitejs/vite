import { expect, test } from 'vitest'
import { isBundledDev, isServe, viteTestUrl } from '~utils'

// this playground uses `base: '/foo'` (no trailing slash), so the base
// middleware receives a `rawBase` that does not end with `/`

test('serves the base root as index.html', async () => {
  const res = await fetch(viteTestUrl)
  expect(res.status).toBe(200)
})

test.runIf(isServe && !isBundledDev)(
  'serves a file through the base',
  async () => {
    const res = await fetch(new URL('/foo/foobar/a.js', viteTestUrl))
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('foobar-file')
  },
)

test('404s a path that only shares a partial segment with the base', async () => {
  const res = await fetch(new URL('/foobar/a.js', viteTestUrl))
  expect(res.status).toBe(404)
  expect(await res.text()).toContain(
    'did you mean to visit /foo/foobar/a.js instead?',
  )
})

test('404s a path outside the base', async () => {
  const res = await fetch(new URL('/not-based.js', viteTestUrl))
  expect(res.status).toBe(404)
  expect(await res.text()).toContain(
    'The server is configured with a public base URL of /foo',
  )
})
