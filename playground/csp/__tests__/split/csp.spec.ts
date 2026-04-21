import { expect, test } from 'vitest'
import { getColor, isBuild, isServe, page } from '~utils'

const getNonce = async (selector: string): Promise<string | null> => {
  const element = await page.$(selector)
  if (!element) return null
  return element.evaluate(
    (node) =>
      (node as HTMLScriptElement | HTMLStyleElement | HTMLLinkElement).nonce ||
      node.getAttribute('nonce'),
  )
}

const getNonces = async (selector: string): Promise<string[]> => {
  return page.$$eval(selector, (nodes) =>
    nodes.map(
      (node) =>
        (node as HTMLScriptElement | HTMLStyleElement | HTMLLinkElement)
          .nonce ||
        node.getAttribute('nonce') ||
        '',
    ),
  )
}

test('linked css', async () => {
  expect(await getColor('.linked')).toBe('blue')
})

test('inline style tag', async () => {
  expect(await getColor('.inline')).toBe('green')
})

test('imported css', async () => {
  expect(await getColor('.from-js')).toBe('blue')
})

test('dynamic css', async () => {
  expect(await getColor('.dynamic')).toBe('red')
})

test('script tag', async () => {
  await expect.poll(() => page.textContent('.js')).toBe('js: ok')
})

test('dynamic js', async () => {
  await expect
    .poll(() => page.textContent('.dynamic-js'))
    .toBe('dynamic-js: ok')
})

test('inline js', async () => {
  await expect.poll(() => page.textContent('.inline-js')).toBe('inline-js: ok')
})

test('split mode injects only split meta tags', async () => {
  expect((await page.$$('meta[property="csp-nonce"]')).length).toBe(0)
  expect((await page.$$('meta[property="csp-script-nonce"]')).length).toBe(1)
  expect((await page.$$('meta[property="csp-style-nonce"]')).length).toBe(1)

  expect(await getNonce('meta[property="csp-script-nonce"]')).not.toBe(
    await getNonce('meta[property="csp-style-nonce"]'),
  )
})

test('split mode routes nonces by destination', async () => {
  const scriptNonce = await getNonce('meta[property="csp-script-nonce"]')
  const styleNonce = await getNonce('meta[property="csp-style-nonce"]')

  expect(await getNonce('link[rel="stylesheet"]')).toBe(styleNonce)
  expect(await getNonce('style')).toBe(styleNonce)
  expect(await getNonce('script[type="module"]')).toBe(scriptNonce)
})

test('nonce attributes are not repeated', async () => {
  const htmlSource = await page.content()
  expect(htmlSource).not.toMatch(
    /<[^>]*\snonce="[^"]*"[^>]*\snonce="[^"]*"[^>]*>/,
  )
  await expect
    .poll(() => page.textContent('.double-nonce-js'))
    .toBe('double-nonce-js: ok')
})

test.runIf(isServe)('dev-injected style tags use the style nonce', async () => {
  const styleNonce = await getNonce('meta[property="csp-style-nonce"]')

  await expect.poll(() => getNonces('style[data-vite-dev-id]')).not.toEqual([])

  expect(
    (await getNonces('style[data-vite-dev-id]')).every(
      (nonce) => nonce === styleNonce,
    ),
  ).toBe(true)
})

test.runIf(isBuild)(
  'build preloads and stylesheets use split nonces',
  async () => {
    const scriptNonce = await getNonce('meta[property="csp-script-nonce"]')
    const styleNonce = await getNonce('meta[property="csp-style-nonce"]')

    await expect
      .poll(() =>
        getNonces(
          'link[rel="modulepreload"], link[rel="preload"][as="script"]',
        ),
      )
      .not.toEqual([])

    await expect.poll(() => getNonces('link[rel="stylesheet"]')).not.toEqual([])

    expect(
      (
        await getNonces(
          'link[rel="modulepreload"], link[rel="preload"][as="script"]',
        )
      ).every((nonce) => nonce === scriptNonce),
    ).toBe(true)
    expect(
      (await getNonces('link[rel="stylesheet"]')).every(
        (nonce) => nonce === styleNonce,
      ),
    ).toBe(true)
  },
)
