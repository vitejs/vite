import { expect, test } from 'vitest'
import { browser, isBundled, page, viteTestUrl } from '~utils'

test('buttons wait for wasm module initialization', async () => {
  const delayedPage = await browser.newPage()
  try {
    await delayedPage.addInitScript(() => {
      const ready = new Promise<void>((resolve) => {
        window.addEventListener('test:release-wasm', () => resolve(), {
          once: true,
        })
      })
      function holdInstantiation<T extends (...args: never[]) => unknown>(
        instantiate: T,
      ): T {
        return new Proxy(instantiate, {
          async apply(target, thisArg, args) {
            document.documentElement.dataset.wasmPending = 'true'
            await ready
            return Reflect.apply(target, thisArg, args)
          },
        })
      }
      WebAssembly.instantiate = holdInstantiation(WebAssembly.instantiate)
      WebAssembly.instantiateStreaming = holdInstantiation(
        WebAssembly.instantiateStreaming,
      )
    })
    await delayedPage.goto(viteTestUrl)
    await delayedPage.waitForFunction(
      () => document.documentElement.dataset.wasmPending === 'true',
    )
    expect(
      await delayedPage.evaluate(() =>
        Array.from(
          document.querySelectorAll<HTMLButtonElement>('button.run'),
          (button) => button.disabled,
        ),
      ),
    ).toEqual([true, true, true])

    await delayedPage.evaluate(() =>
      window.dispatchEvent(new Event('test:release-wasm')),
    )
    for (const [selector, result] of [
      ['.inline-wasm', '42'],
      ['.output-wasm', '24'],
      ['.init-returns-instance', 'true'],
    ]) {
      await delayedPage.click(`${selector} .run`)
      await expect
        .poll(() => delayedPage.textContent(`${selector} .result`))
        .toBe(result)
    }
  } finally {
    await delayedPage.close()
  }
})

test('should work when inlined', async () => {
  await page.click('.inline-wasm .run')
  await expect
    .poll(() => page.textContent('.inline-wasm .result'))
    .toMatch('42')
})

test('should work when output', async () => {
  await page.click('.output-wasm .run')
  await expect
    .poll(() => page.textContent('.output-wasm .result'))
    .toMatch('24')
})

test('init function returns WebAssembly.Instance', async () => {
  await page.click('.init-returns-instance .run')
  await expect
    .poll(() => page.textContent('.init-returns-instance .result'))
    .toMatch('true')
})

test('?url', async () => {
  expect(await page.textContent('.url')).toMatch(
    isBundled ? 'data:application/wasm' : '/light.wasm',
  )
})

test('should work when wasm in worker', async () => {
  await expect.poll(() => page.textContent('.worker-wasm .result')).toMatch('3')
})

test('direct wasm import', async () => {
  await expect.poll(() => page.textContent('.direct-wasm .result')).toMatch('3')
})

test('direct wasm import with wasm imports', async () => {
  await expect
    .poll(() => page.textContent('.direct-wasm-with-imports .result'))
    .toMatch('42')
})

test('direct wasm import unwraps exported WebAssembly.Global', async () => {
  await expect
    .poll(() => page.textContent('.direct-wasm-global .result'))
    .toMatch('42 number')
})

test('wasm importing a global from another wasm', async () => {
  await expect
    .poll(() => page.textContent('.direct-wasm-global-import .result'))
    .toMatch('43')
})

test('wasm reading a mutable global mutated by another wasm', async () => {
  await expect
    .poll(() => page.textContent('.direct-wasm-mutable-global-import .result'))
    .toMatch('9')
})

test('wasm using js-string builtins and imported string constants', async () => {
  await expect
    .poll(() => page.textContent('.direct-wasm-string-builtins .result'))
    .toMatch('5')
})
