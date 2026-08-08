import { expect } from 'vitest'
import { page, viteTestUrl } from '~utils'

// serialized and run in the browser, so it must not reference anything outside itself.
// `.nonce` is read first to get along with nonce hiding
const readNonce = (node: Element) =>
  (node as HTMLScriptElement | HTMLStyleElement | HTMLLinkElement).nonce ||
  node.getAttribute('nonce') ||
  ''

export async function getNonce(selector: string): Promise<string | null> {
  const element = await page.$(selector)
  if (!element) return null
  return element.evaluate(readNonce)
}

export async function getNonces(selector: string): Promise<string[]> {
  const elements = await page.$$(selector)
  return Promise.all(elements.map((element) => element.evaluate(readNonce)))
}

/**
 * Assert that at least one element matches and that every match carries
 * `expected`, polling because tags appended by `__vitePreload` only show up once
 * the dynamic import runs.
 *
 * This settles on the first correct match, so callers should already have waited
 * for the dynamic imports — every caller here runs after a test that does.
 */
export async function expectNoncesToBe(
  selector: string,
  expected: string | null,
): Promise<void> {
  await expect
    .poll(async () => {
      const nonces = await getNonces(selector)
      return nonces.length > 0 && nonces.every((nonce) => nonce === expected)
    })
    .toBe(true)
}

/**
 * The HTML as served, before the browser parses it.
 *
 * `page.content()` re-serializes the DOM, which silently drops a repeated
 * attribute — so a duplicated `nonce` is only visible here.
 */
export async function fetchRawHtml(): Promise<string> {
  const response = await fetch(viteTestUrl)
  return response.text()
}

/** Matches a tag carrying two `nonce` attributes. */
export const repeatedNonceRE = /<[^>]*\snonce="[^"]*"[^>]*\snonce="[^"]*"[^>]*>/

/**
 * The entry script from `index.html` — in dev the first `script[type=module]`
 * is `/@vite/client`, and after build the file name is hashed.
 */
export const APP_SCRIPT_SELECTOR =
  'script[type="module"]:not([src="/@vite/client"])'
