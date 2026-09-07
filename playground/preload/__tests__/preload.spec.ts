import { describe, expect, test } from 'vitest'
import { browserLogs, isBuild, page } from '~utils'

test('should have no 404s', () => {
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('404')
  })
})

describe.runIf(isBuild)('build', () => {
  test('dynamic import', async () => {
    await page.waitForSelector('#done')
    expect(await page.textContent('#done')).toBe('ran js')
  })

  test('dynamic import with comments', async () => {
    await page.click('#hello .load')
    await page.waitForSelector('#hello output')

    const html = await page.content()
    expect(html).toMatch(
      /link rel="modulepreload".*?href=".*?\/assets\/hello-[-\w]{8}\.js"/,
    )
    expect(html).toMatch(
      /link rel="stylesheet".*?href=".*?\/assets\/hello-[-\w]{8}\.css"/,
    )
  })

  test('does not create settlement promises for JS or already seen dependencies', async () => {
    await page.reload()
    await page.waitForSelector('#done')
    const emptyResolutions = await page.evaluate(async () => {
      const originalResolve = Promise.resolve
      let emptyResolutions = 0
      Promise.resolve = function (...args: Parameters<typeof Promise.resolve>) {
        if (args.length === 1 && args[0] === undefined) emptyResolutions++
        return originalResolve.apply(this, args)
      } as typeof Promise.resolve
      try {
        for (let i = 0; i < 2; i++) {
          await new Promise<void>((resolve) => {
            const observer = new MutationObserver(() => {
              if (document.querySelectorAll('#hello output').length === i + 1) {
                observer.disconnect()
                resolve()
              }
            })
            observer.observe(document.querySelector('#hello')!, {
              childList: true,
            })
            document.querySelector<HTMLButtonElement>('#hello .load')!.click()
          })
        }
        return emptyResolutions
      } finally {
        Promise.resolve = originalResolve
      }
    })
    expect(emptyResolutions).toBe(0)
    expect(await page.textContent('#hello .msg')).not.toBe('')
  })
})
