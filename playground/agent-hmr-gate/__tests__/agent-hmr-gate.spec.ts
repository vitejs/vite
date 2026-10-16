import { describe, expect, test } from 'vitest'
import { editFile, isServe, page, viteTestUrl } from '~utils'

async function post(path: string) {
  const response = await fetch(`${viteTestUrl}/__agent_hmr/${path}`, {
    method: 'POST',
  })
  expect(response.ok).toBe(true)
  return response.json()
}

describe.runIf(isServe)('agent HMR gate', () => {
  test('holds a multi-file edit and applies it without intermediate renders', async () => {
    await expect.poll(() => page.textContent('#app')).toBe('first-v1:second-v1')
    const initialReloads = await page.evaluate(() =>
      Number(sessionStorage.getItem('reload-count')),
    )
    await page.evaluate(() => {
      const states: string[] = []
      ;(window as any).__renderedStates = states
      new MutationObserver(() => {
        states.push(document.querySelector('#app')!.textContent!)
      }).observe(document.querySelector('#app')!, {
        childList: true,
        characterData: true,
        subtree: true,
      })
    })

    await post('begin')
    editFile('src/first.ts', (source) =>
      source.replace("'first-v1'", "'first-v1'\ninvalid("),
    )
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(await page.locator('vite-error-overlay').count()).toBe(0)
    editFile('src/first.ts', (source) =>
      source.replace("'first-v1'\ninvalid(", "'first-version-2'"),
    )
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(await page.textContent('#app')).toBe('first-v1:second-v1')
    expect(
      await page.evaluate(() => Number(sessionStorage.getItem('reload-count'))),
    ).toBe(initialReloads)
    expect(await page.evaluate(() => (window as any).__renderedStates)).toEqual(
      [],
    )

    // Flush immediately so the gate must wait for the final watcher event.
    editFile('src/second.ts', (source) =>
      source.replace('second-v1', 'second-version-2'),
    )
    await post('flush')
    await expect
      .poll(() => page.textContent('#app'))
      .toBe('first-version-2:second-version-2')
    expect(
      await page.evaluate(() => Number(sessionStorage.getItem('reload-count'))),
    ).toBe(initialReloads)
    expect(await page.evaluate(() => (window as any).__renderedStates)).toEqual(
      ['first-version-2:second-version-2'],
    )

    await post('begin')
    editFile('src/first.ts', (source) =>
      source.replace('first-version-2', 'first-version-3-final'),
    )
    await new Promise((resolve) => setTimeout(resolve, 300))
    editFile('src/second.ts', (source) =>
      source.replace("'second-version-2'", "'second-version-2'\ninvalid("),
    )
    await new Promise((resolve) => setTimeout(resolve, 300))

    await post('flush')
    await expect.poll(() => page.isVisible('vite-error-overlay')).toBe(true)
    expect(await page.textContent('#app')).toBe(
      'first-version-2:second-version-2',
    )

    await post('begin')
    editFile('src/second.ts', (source) =>
      source.replace(
        "'second-version-2'\ninvalid(",
        "'second-version-3-final'",
      ),
    )
    await post('flush')
    await expect
      .poll(() => page.textContent('#app'))
      .toBe('first-version-3-final:second-version-3-final')
    expect(
      await page.evaluate(() => Number(sessionStorage.getItem('reload-count'))),
    ).toBe(initialReloads + 1)
  })
})
