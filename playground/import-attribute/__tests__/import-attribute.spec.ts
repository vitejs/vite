import { expect, test } from 'vitest'
import { bundledDevTodo, isBundled, page } from '~utils'

test('from source code', async () => {
  expect(await page.textContent('.src')).toBe('bar')
})

test('from dependency', async () => {
  expect(await page.textContent('.dep')).toBe('world')
})

test.each(['json', 'assertion', 'ordinary', 'template', 'comments', 'nested'])(
  'dynamic import: %s',
  async (name) => {
    expect(
      await page.evaluate(async (name) => {
        const data = await (window as any).importAttribute[name]()
        return data.default.foo
      }, name),
    ).toBe('bar')
  },
)

// Rolldown currently drops import options, including their side effects.
test.skipIf(isBundled)('evaluates dynamic import options once', async () => {
  expect(
    await page.evaluate(() => (window as any).importAttribute.options()),
  ).toEqual({ value: 'bar', calls: ['options', 'value'] })
})

test.skipIf(isBundled)(
  'preserves synchronous errors from evaluating import options',
  async () => {
    expect(
      await page.evaluate(() => (window as any).importAttribute.throwing()),
    ).toEqual({ synchronous: true, message: 'options error' })
  },
)

test.skipIf(isBundled)('evaluates an import options getter', async () => {
  expect(
    await page.evaluate(() => (window as any).importAttribute.getter()),
  ).toEqual({ value: 'bar', calls: 1 })
})

test.skipIf(isBundled)(
  'rejects when an import options getter throws',
  async () => {
    expect(
      await page.evaluate(() =>
        (window as any).importAttribute.throwingGetter(),
      ),
    ).toBe('getter error')
  },
)

test.skipIf(isBundled)(
  'rejects when an import attribute getter throws',
  async () => {
    expect(
      await page.evaluate(() =>
        (window as any).importAttribute.attributeGetter(),
      ),
    ).toBe('attribute getter error')
  },
)

test.each(['nativeData', 'nativeHttp'])(
  'preserves native JSON import attributes: %s',
  bundledDevTodo('native JSON imports fail through the lazy loader'),
  async (name) => {
    await page.route('https://example.com/data.json', (route) =>
      route.fulfill({
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: '{"foo":"native"}',
      }),
    )
    expect(
      await page.evaluate(async (name) => {
        const data = await (window as any).importAttribute[name]()
        return data.default.foo
      }, name),
    ).toBe('native')
    await page.unrouteAll()
  },
)
