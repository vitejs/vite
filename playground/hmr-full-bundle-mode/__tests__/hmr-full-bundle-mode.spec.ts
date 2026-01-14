import { setTimeout } from 'node:timers/promises'
import { expect, test } from 'vitest'
import { editFile, isBuild, page } from '~utils'

if (isBuild) {
  test('should render', async () => {
    expect(await page.textContent('h1')).toContain('HMR Full Bundle Mode')
    await expect.poll(() => page.textContent('.app')).toBe('hello')
    await expect.poll(() => page.textContent('.hmr')).toBe('hello')
  })
} else {
  // INITIAL -> BUNDLING -> BUNDLED
  test('show bundling in progress', async () => {
    const reloadPromise = page.waitForEvent('load')
    await expect
      .poll(() => page.textContent('body'))
      .toContain('Bundling in progress')
    await reloadPromise // page shown after reload
    await expect.poll(() => page.textContent('h1')).toBe('HMR Full Bundle Mode')
    await expect.poll(() => page.textContent('.app')).toBe('hello')
  })

  // BUNDLED -> GENERATE_HMR_PATCH -> BUNDLING -> BUNDLE_ERROR -> BUNDLING -> BUNDLED
  test('handle bundle error', async () => {
    editFile('main.js', (code) =>
      code.replace("text('.app', 'hello')", "text('.app', 'hello'); text("),
    )
    await expect.poll(() => page.isVisible('vite-error-overlay')).toBe(true)
    editFile('main.js', (code) =>
      code.replace("text('.app', 'hello'); text(", "text('.app', 'hello')"),
    )
    await expect.poll(() => page.isVisible('vite-error-overlay')).toBe(false)
    await expect.poll(() => page.textContent('.app')).toBe('hello')
  })

  // BUNDLED -> GENERATE_HMR_PATCH -> BUNDLING -> BUNDLED
  test('update bundle', async () => {
    editFile('main.js', (code) =>
      code.replace("text('.app', 'hello')", "text('.app', 'hello1')"),
    )
    await expect.poll(() => page.textContent('.app')).toBe('hello1')

    editFile('main.js', (code) =>
      code.replace("text('.app', 'hello1')", "text('.app', 'hello')"),
    )
    await expect.poll(() => page.textContent('.app')).toBe('hello')
  })

  // BUNDLED -> GENERATE_HMR_PATCH -> BUNDLING -> BUNDLING -> BUNDLED
  test('debounce bundle', async () => {
    editFile('main.js', (code) =>
      code.replace(
        "text('.app', 'hello')",
        "text('.app', 'hello1')\n" + '// @delay-transform',
      ),
    )
    await setTimeout(100)
    editFile('main.js', (code) =>
      code.replace("text('.app', 'hello1')", "text('.app', 'hello2')"),
    )
    await expect.poll(() => page.textContent('.app')).toBe('hello2')

    editFile('main.js', (code) =>
      code.replace(
        "text('.app', 'hello2')\n" + '// @delay-transform',
        "text('.app', 'hello')",
      ),
    )
    await expect.poll(() => page.textContent('.app')).toBe('hello')
  })

  // BUNDLED -> GENERATING_HMR_PATCH -> BUNDLED
  test('handle generate hmr patch error', async () => {
    await expect.poll(() => page.textContent('.hmr')).toBe('hello')
    editFile('hmr.js', (code) =>
      code.replace("const foo = 'hello'", "const foo = 'hello"),
    )
    await expect.poll(() => page.isVisible('vite-error-overlay')).toBe(true)

    editFile('hmr.js', (code) =>
      code.replace("const foo = 'hello", "const foo = 'hello'"),
    )
    await expect.poll(() => page.isVisible('vite-error-overlay')).toBe(false)
    await expect.poll(() => page.textContent('.hmr')).toContain('hello')
  })

  // BUNDLED -> GENERATING_HMR_PATCH -> BUNDLED
  test('generate hmr patch', async () => {
    await expect.poll(() => page.textContent('.hmr')).toBe('hello')
    editFile('hmr.js', (code) =>
      code.replace("const foo = 'hello'", "const foo = 'hello1'"),
    )
    await expect.poll(() => page.textContent('.hmr')).toBe('hello1')

    editFile('hmr.js', (code) =>
      code.replace("const foo = 'hello1'", "const foo = 'hello'"),
    )
    await expect.poll(() => page.textContent('.hmr')).toContain('hello')
  })

  // BUNDLED -> GENERATING_HMR_PATCH -> GENERATING_HMR_PATCH -> BUNDLED
  test('continuous generate hmr patch', async () => {
    editFile('hmr.js', (code) =>
      code.replace(
        "const foo = 'hello'",
        "const foo = 'hello1'\n" + '// @delay-transform',
      ),
    )
    await setTimeout(100)
    editFile('hmr.js', (code) =>
      code.replace("const foo = 'hello1'", "const foo = 'hello2'"),
    )
    await expect.poll(() => page.textContent('.hmr')).toBe('hello2')

    editFile('hmr.js', (code) =>
      code.replace(
        "const foo = 'hello2'\n" + '// @delay-transform',
        "const foo = 'hello'",
      ),
    )
    await expect.poll(() => page.textContent('.hmr')).toBe('hello')
  })

  test('lazy bundling', async () => {
    await page.click('#load-dynamic')
    await expect.poll(() => page.textContent('.dynamic')).toBe('loaded')
  })
}
