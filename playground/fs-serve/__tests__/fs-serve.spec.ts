import fetch from 'node-fetch'
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest'
import type { Page } from 'playwright-chromium'
import WebSocket from 'ws'
import testJSON from '../safe.json'
import { browser, isServe, page, viteServer, viteTestUrl } from '~utils'

const getViteTestIndexHtmlUrl = () => {
  const srcPrefix = viteTestUrl.endsWith('/') ? '' : '/'
  // NOTE: viteTestUrl is set lazily
  return viteTestUrl + srcPrefix + 'src/'
}

const stringified = JSON.stringify(testJSON)

describe.runIf(isServe)('main', () => {
  beforeAll(async () => {
    await page.goto(getViteTestIndexHtmlUrl())
  })

  test('default import', async () => {
    expect(await page.textContent('.full')).toBe(stringified)
  })

  test('named import', async () => {
    expect(await page.textContent('.named')).toBe(testJSON.msg)
  })

  test('safe fetch', async () => {
    expect(await page.textContent('.safe-fetch')).toMatch('KEY=safe')
    expect(await page.textContent('.safe-fetch-status')).toBe('200')
  })

  test('safe fetch with query', async () => {
    expect(await page.textContent('.safe-fetch-query')).toMatch('KEY=safe')
    expect(await page.textContent('.safe-fetch-query-status')).toBe('200')
  })

  test('safe fetch with special characters', async () => {
    expect(
      await page.textContent('.safe-fetch-subdir-special-characters'),
    ).toMatch('KEY=safe')
    expect(
      await page.textContent('.safe-fetch-subdir-special-characters-status'),
    ).toBe('200')
  })

  test('unsafe fetch', async () => {
    expect(await page.textContent('.unsafe-fetch')).toMatch('403 Restricted')
    expect(await page.textContent('.unsafe-fetch-status')).toBe('403')
  })

  test('unsafe fetch with special characters (#8498)', async () => {
    expect(await page.textContent('.unsafe-fetch-8498')).toBe('')
    expect(await page.textContent('.unsafe-fetch-8498-status')).toBe('404')
  })

  test('unsafe fetch with special characters 2 (#8498)', async () => {
    expect(await page.textContent('.unsafe-fetch-8498-2')).toBe('')
    expect(await page.textContent('.unsafe-fetch-8498-2-status')).toBe('404')
  })

  test('safe fs fetch', async () => {
    expect(await page.textContent('.safe-fs-fetch')).toBe(stringified)
    expect(await page.textContent('.safe-fs-fetch-status')).toBe('200')
  })

  test('safe fs fetch', async () => {
    expect(await page.textContent('.safe-fs-fetch-query')).toBe(stringified)
    expect(await page.textContent('.safe-fs-fetch-query-status')).toBe('200')
  })

  test('safe fs fetch with special characters', async () => {
    expect(await page.textContent('.safe-fs-fetch-special-characters')).toBe(
      stringified,
    )
    expect(
      await page.textContent('.safe-fs-fetch-special-characters-status'),
    ).toBe('200')
  })

  test('unsafe fs fetch', async () => {
    expect(await page.textContent('.unsafe-fs-fetch')).toBe('')
    expect(await page.textContent('.unsafe-fs-fetch-status')).toBe('403')
  })

  test('unsafe fs fetch', async () => {
    expect(await page.textContent('.unsafe-fs-fetch-raw')).toBe('')
    expect(await page.textContent('.unsafe-fs-fetch-raw-status')).toBe('403')
  })

  test('unsafe fs fetch with special characters (#8498)', async () => {
    expect(await page.textContent('.unsafe-fs-fetch-8498')).toBe('')
    expect(await page.textContent('.unsafe-fs-fetch-8498-status')).toBe('404')
  })

  test('unsafe fs fetch with special characters 2 (#8498)', async () => {
    expect(await page.textContent('.unsafe-fs-fetch-8498-2')).toBe('')
    expect(await page.textContent('.unsafe-fs-fetch-8498-2-status')).toBe('404')
  })

  test('nested entry', async () => {
    expect(await page.textContent('.nested-entry')).toBe('foobar')
  })

  test('denied', async () => {
    expect(await page.textContent('.unsafe-dotenv')).toBe('403')
  })

  test('denied EnV casing', async () => {
    // It is 403 in case insensitive system, 404 in others
    const code = await page.textContent('.unsafe-dotEnV-casing')
    expect(code === '403' || code === '404').toBeTruthy()
  })
})

describe('fetch', () => {
  test('serve with configured headers', async () => {
    const res = await fetch(viteTestUrl + '/src/')
    expect(res.headers.get('x-served-by')).toBe('vite')
  })
})

describe('cross origin', () => {
  const fetchStatusFromPage = async (page: Page, url: string) => {
    return await page.evaluate(async (url: string) => {
      try {
        const res = await globalThis.fetch(url)
        return res.status
      } catch {
        return -1
      }
    }, url)
  }

  const connectWebSocketFromPage = async (page: Page, url: string) => {
    return await page.evaluate(async (url: string) => {
      try {
        const ws = new globalThis.WebSocket(url, ['vite-hmr'])
        await new Promise<void>((resolve, reject) => {
          ws.addEventListener('open', () => {
            resolve()
            ws.close()
          })
          ws.addEventListener('error', () => {
            reject()
          })
        })
        return true
      } catch {
        return false
      }
    }, url)
  }

  const connectWebSocketFromServer = async (
    url: string,
    origin: string | undefined,
  ) => {
    try {
      const ws = new WebSocket(url, ['vite-hmr'], {
        headers: {
          ...(origin ? { Origin: origin } : undefined),
        },
      })
      await new Promise<void>((resolve, reject) => {
        ws.addEventListener('open', () => {
          resolve()
          ws.close()
        })
        ws.addEventListener('error', () => {
          reject()
        })
      })
      return true
    } catch {
      return false
    }
  }

  describe('allowed for same origin', () => {
    beforeEach(async () => {
      await page.goto(getViteTestIndexHtmlUrl())
    })

    test('fetch HTML file', async () => {
      const status = await fetchStatusFromPage(page, viteTestUrl + '/src/')
      expect(status).toBe(200)
    })

    test.runIf(isServe)('fetch JS file', async () => {
      const status = await fetchStatusFromPage(
        page,
        viteTestUrl + '/src/code.js',
      )
      expect(status).toBe(200)
    })

    test.runIf(isServe)('connect WebSocket with valid token', async () => {
      const token = viteServer.config.webSocketToken
      const result = await connectWebSocketFromPage(
        page,
        `${viteTestUrl}?token=${token}`,
      )
      expect(result).toBe(true)
    })

    test.runIf(isServe)(
      'connect WebSocket without a token without the origin header',
      async () => {
        const result = await connectWebSocketFromServer(viteTestUrl, undefined)
        expect(result).toBe(true)
      },
    )
  })

  describe('denied for different origin', async () => {
    let page2: Page
    beforeEach(async () => {
      page2 = await browser.newPage()
      await page2.goto('http://vite.dev/404')
    })
    afterEach(async () => {
      await page2.close()
    })

    test('fetch HTML file', async () => {
      const status = await fetchStatusFromPage(page2, viteTestUrl + '/src/')
      expect(status).not.toBe(200)
    })

    test.runIf(isServe)('fetch JS file', async () => {
      const status = await fetchStatusFromPage(
        page2,
        viteTestUrl + '/src/code.js',
      )
      expect(status).not.toBe(200)
    })

    test.runIf(isServe)('connect WebSocket without token', async () => {
      const result = await connectWebSocketFromPage(page, viteTestUrl)
      expect(result).toBe(false)

      const result2 = await connectWebSocketFromPage(
        page,
        `${viteTestUrl}?token=`,
      )
      expect(result2).toBe(false)
    })

    test.runIf(isServe)('connect WebSocket with invalid token', async () => {
      const token = viteServer.config.webSocketToken
      const result = await connectWebSocketFromPage(
        page,
        `${viteTestUrl}?token=${'t'.repeat(token.length)}`,
      )
      expect(result).toBe(false)

      const result2 = await connectWebSocketFromPage(
        page,
        `${viteTestUrl}?token=${'t'.repeat(token.length)}t`, // different length
      )
      expect(result2).toBe(false)
    })
  })
})
