import http from 'node:http'
import path from 'node:path'
import fs from 'node:fs'
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

const safeJsonContent = fs.readFileSync(
  path.resolve(import.meta.dirname, '../safe.json'),
  'utf-8',
)
const stringified = JSON.stringify(testJSON)

beforeAll(async () => {
  await page.goto(getViteTestIndexHtmlUrl())
})

describe.runIf(isServe)('normal', () => {
  test('default import', async () => {
    await expect.poll(() => page.textContent('.full')).toBe(stringified)
  })

  test('named import', async () => {
    await expect.poll(() => page.textContent('.named')).toBe(testJSON.msg)
  })

  test('nested entry', async () => {
    await expect.poll(() => page.textContent('.nested-entry')).toBe('foobar')
  })

  test('virtual svg module', async () => {
    await expect.poll(() => page.textContent('.virtual-svg')).toMatch('<svg')
  })
})

describe.runIf(isServe)('matrix', () => {
  const variants = [
    { variantId: '', variantName: 'normal' },
    { variantId: '-fs', variantName: '/@fs/' },
  ] as const
  type VariantId = (typeof variants)[number]['variantId']
  const cases: Array<{
    name: string
    testId: string
    content: string | RegExp
    status: string | string[]
    skipVariants?: VariantId[]
    isSPAFallback?: boolean
  }> = [
    {
      name: 'safe fetch',
      testId: 'safe',
      content: /KEY=safe/,
      status: '200',
    },
    {
      name: 'safe fetch with query',
      testId: 'safe-query',
      content: /KEY=safe/,
      status: '200',
    },
    // TODO: missing `fetch-safe-subdir` here
    {
      name: 'safe fetch with special characters',
      testId: 'safe-subdir-special-characters',
      content: /KEY=safe/,
      status: '200',
    },
    {
      name: 'safe fetch with special characters 2',
      testId: 'safe-subdir-special-characters2',
      content: safeJsonContent,
      status: '200',
    },
    {
      name: 'safe fetch imported',
      testId: 'safe-imported',
      content: safeJsonContent,
      status: '200',
      skipVariants: [''],
    },
    {
      name: 'safe fetch imported with query',
      testId: 'safe-imported-query',
      content: safeJsonContent,
      status: '200',
      skipVariants: [''],
    },

    {
      name: 'unsafe fetch',
      testId: 'unsafe',
      content: /403 Restricted/,
      status: '403',
    },
    {
      name: 'unsafe JSON fetch',
      testId: 'unsafe-json',
      content: /403 Restricted/,
      status: '403',
      skipVariants: [''],
    },
    {
      name: 'unsafe HTML fetch',
      testId: 'unsafe-html',
      content: /403 Restricted/,
      status: '403',
    },
    {
      name: 'unsafe HTML fetch outside root',
      testId: 'unsafe-html-outside-root',
      content: /403 Restricted/,
      status: '403',
      skipVariants: [''],
    },
    {
      name: 'unsafe fetch with special characters (#8498)',
      testId: 'unsafe-8498',
      content: '',
      status: '404',
    },
    {
      name: 'unsafe fetch with special characters 2 (#8498)',
      testId: 'unsafe-8498-2',
      content: '',
      status: '404',
    },
    {
      name: 'unsafe fetch import inline',
      testId: 'unsafe-import-inline',
      content: /403 Restricted/,
      status: '403',
    },
    {
      name: 'unsafe fetch raw query import',
      testId: 'unsafe-raw-query-import',
      content: /403 Restricted/,
      status: '403',
    },
    {
      name: 'unsafe fetch raw import raw outside root',
      testId: 'unsafe-raw-import-raw-outside-root',
      content: /403 Restricted/,
      status: '403',
      skipVariants: [''],
    },
    {
      name: 'unsafe fetch raw import raw outside root 1',
      testId: 'unsafe-raw-import-raw-outside-root1',
      content: /403 Restricted/,
      status: '403',
      skipVariants: [''],
    },
    {
      name: 'unsafe fetch raw import raw outside root 2',
      testId: 'unsafe-raw-import-raw-outside-root2',
      content: /403 Restricted/,
      status: '403',
      skipVariants: [''],
    },
    {
      name: 'unsafe fetch ?.svg?import',
      testId: 'unsafe-query-dot-svg-import',
      content: /403 Restricted/,
      status: '403',
    },
    {
      name: 'unsafe fetch .svg?import',
      testId: 'unsafe-svg',
      content: /403 Restricted/,
      status: '403',
    },
    {
      name: 'unsafe fetch import inline wasm init',
      testId: 'unsafe-import-inline-wasm-init',
      content: /403 Restricted/,
      status: '403',
    },
    // It is 404 in `fs-serve/base` test, 403 in `fs-serve` test
    {
      name: 'unsafe fetch with relative path after query',
      testId: 'unsafe-relative-path-after-query',
      content: /403 Restricted|^$/,
      status: ['403', '404'],
      isSPAFallback: true,
    },
    {
      name: 'denied .env',
      testId: 'unsafe-dotenv',
      content: /403 Restricted/,
      status: '403',
    },
    // It is 403 in case insensitive system, 404 in others
    {
      name: 'denied env casing',
      testId: 'unsafe-dotenv-casing',
      content: /403 Restricted|^$/,
      status: ['403', '404'],
    },
    {
      name: 'denied env with ?.svg?.wasm?init',
      testId: 'unsafe-dotenv-query-dot-svg-wasm-init',
      content: /403 Restricted/,
      status: '403',
    },
  ]

  for (const {
    name,
    testId,
    content,
    status,
    skipVariants,
    isSPAFallback,
  } of cases) {
    for (const { variantId, variantName } of variants) {
      if (skipVariants?.includes(variantId)) {
        continue
      }

      test.concurrent(`${name} (${variantName})`, async () => {
        const baseSelector = `.fetch${variantId}-${testId}`
        const actualStatus = expect.poll(() =>
          page.textContent(`${baseSelector}-status`),
        )
        const actualContent = expect.poll(() =>
          page.textContent(`${baseSelector}-content`),
        )

        if (variantName === 'normal' && isSPAFallback) {
          await actualStatus.toBe('200')
          await actualContent.toContain('<h1>FS Serve Matrix Test Summary</h1>')
          return
        }

        if (typeof status === 'string') {
          await actualStatus.toBe(status)
        } else {
          await actualStatus.toBeOneOf(status)
        }

        if (typeof content === 'string') {
          await actualContent.toBe(content)
        } else {
          await actualContent.toMatch(content)
        }
      })
    }
  }
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
    host: string,
    origin: string | undefined,
  ) => {
    try {
      const ws = new WebSocket(url, ['vite-hmr'], {
        headers: {
          Host: host,
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

    test('fetch with allowed hosts', async () => {
      const viteTestUrlUrl = new URL(viteTestUrl)
      const res = await fetch(viteTestUrl + '/src/index.html', {
        headers: { Host: viteTestUrlUrl.host },
      })
      expect(res.status).toBe(200)
    })

    test.runIf(isServe)(
      'connect WebSocket with valid token with allowed hosts',
      async () => {
        const viteTestUrlUrl = new URL(viteTestUrl)
        const token = viteServer.config.webSocketToken
        const result = await connectWebSocketFromServer(
          `${viteTestUrl}?token=${token}`,
          viteTestUrlUrl.host,
          viteTestUrlUrl.origin,
        )
        expect(result).toBe(true)
      },
    )

    test.runIf(isServe)(
      'connect WebSocket without a token without the origin header',
      async () => {
        const viteTestUrlUrl = new URL(viteTestUrl)
        const result = await connectWebSocketFromServer(
          viteTestUrl,
          viteTestUrlUrl.host,
          undefined,
        )
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

    test('fetch with non-allowed hosts', async () => {
      // NOTE: fetch cannot be used here as `fetch` sets the correct `Host` header
      const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
        http
          .get(
            viteTestUrl + '/src/index.html',
            {
              headers: {
                Host: 'vite.dev',
              },
            },
            (res) => {
              resolve(res)
            },
          )
          .on('error', (e) => {
            reject(e)
          })
      })
      expect(res.statusCode).toBe(403)
    })

    test.runIf(isServe)(
      'connect WebSocket with valid token with non-allowed hosts',
      async () => {
        const token = viteServer.config.webSocketToken
        const result = await connectWebSocketFromServer(
          `${viteTestUrl}?token=${token}`,
          'vite.dev',
          'http://vite.dev',
        )
        expect(result).toBe(false)

        const result2 = await connectWebSocketFromServer(
          `${viteTestUrl}?token=${token}`,
          'vite.dev',
          undefined,
        )
        expect(result2).toBe(false)
      },
    )
  })
})

describe.runIf(!isServe)('preview HTML', () => {
  test('unsafe HTML fetch', async () => {
    await expect
      .poll(() => page.textContent('.fetch-unsafe-html-status'))
      .toBe('404')
    await expect
      .poll(() => page.textContent('.fetch-unsafe-html-content'))
      .toBe('')
  })
})

test.runIf(isServe)(
  'load script with no-cors mode from a different origin',
  async () => {
    const viteTestUrlUrl = new URL(viteTestUrl)

    // NOTE: fetch cannot be used here as `fetch` sets some headers automatically
    const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
      http
        .get(
          viteTestUrl + '/src/code.js',
          {
            headers: {
              'Sec-Fetch-Dest': 'script',
              'Sec-Fetch-Mode': 'no-cors',
              'Sec-Fetch-Site': 'same-site',
              Origin: 'http://vite.dev',
              Host: viteTestUrlUrl.host,
            },
          },
          (res) => {
            resolve(res)
          },
        )
        .on('error', (e) => {
          reject(e)
        })
    })
    expect(res.statusCode).toBe(200)
    const body = Buffer.concat(await ArrayFromAsync(res)).toString()
    expect(body).toContain(
      'Cross-origin requests for classic scripts must be made with CORS mode enabled.',
    )
  },
)

test.runIf(isServe)(
  'load image with no-cors mode from a different origin should be allowed',
  async () => {
    const viteTestUrlUrl = new URL(viteTestUrl)

    // NOTE: fetch cannot be used here as `fetch` sets some headers automatically
    const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
      http
        .get(
          viteTestUrl + '/src/code.js',
          {
            headers: {
              'Sec-Fetch-Dest': 'image',
              'Sec-Fetch-Mode': 'no-cors',
              'Sec-Fetch-Site': 'same-site',
              Origin: 'http://vite.dev',
              Host: viteTestUrlUrl.host,
            },
          },
          (res) => {
            resolve(res)
          },
        )
        .on('error', (e) => {
          reject(e)
        })
    })
    expect(res.statusCode).not.toBe(403)
    const body = Buffer.concat(await ArrayFromAsync(res)).toString()
    expect(body).not.toContain(
      'Cross-origin requests for classic scripts must be made with CORS mode enabled.',
    )
  },
)

// Note: Array.fromAsync is only supported in Node.js 22+
async function ArrayFromAsync<T>(
  asyncIterable: AsyncIterable<T>,
): Promise<T[]> {
  const chunks = []
  for await (const chunk of asyncIterable) {
    chunks.push(chunk)
  }
  return chunks
}
