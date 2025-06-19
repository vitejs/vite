import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import http from 'node:http'
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

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
    await expect.poll(() => page.textContent('.full')).toBe(stringified)
  })

  test('named import', async () => {
    await expect.poll(() => page.textContent('.named')).toBe(testJSON.msg)
  })

  test('virtual svg module', async () => {
    await expect.poll(() => page.textContent('.virtual-svg')).toMatch('<svg')
  })

  test('safe fetch', async () => {
    await expect.poll(() => page.textContent('.safe-fetch')).toMatch('KEY=safe')
    await expect.poll(() => page.textContent('.safe-fetch-status')).toBe('200')
  })

  test('safe fetch with query', async () => {
    await expect
      .poll(() => page.textContent('.safe-fetch-query'))
      .toMatch('KEY=safe')
    await expect
      .poll(() => page.textContent('.safe-fetch-query-status'))
      .toBe('200')
  })

  test('safe fetch with special characters', async () => {
    await expect
      .poll(() => page.textContent('.safe-fetch-subdir-special-characters'))
      .toMatch('KEY=safe')
    await expect
      .poll(() =>
        page.textContent('.safe-fetch-subdir-special-characters-status'),
      )
      .toBe('200')
  })

  test('unsafe fetch', async () => {
    await expect
      .poll(() => page.textContent('.unsafe-fetch'))
      .toMatch('403 Restricted')
    await expect
      .poll(() => page.textContent('.unsafe-fetch-status'))
      .toBe('403')
  })

  test('unsafe fetch with special characters (#8498)', async () => {
    await expect.poll(() => page.textContent('.unsafe-fetch-8498')).toBe('')
    await expect
      .poll(() => page.textContent('.unsafe-fetch-8498-status'))
      .toBe('404')
  })

  test('unsafe fetch with special characters 2 (#8498)', async () => {
    await expect.poll(() => page.textContent('.unsafe-fetch-8498-2')).toBe('')
    await expect
      .poll(() => page.textContent('.unsafe-fetch-8498-2-status'))
      .toBe('404')
  })

  test('unsafe fetch import inline', async () => {
    await expect
      .poll(() => page.textContent('.unsafe-fetch-import-inline-status'))
      .toBe('403')
  })

  test('unsafe fetch raw query import', async () => {
    await expect
      .poll(() => page.textContent('.unsafe-fetch-raw-query-import-status'))
      .toBe('403')
  })

  test('unsafe fetch ?.svg?import', async () => {
    await expect
      .poll(() => page.textContent('.unsafe-fetch-query-dot-svg-import-status'))
      .toBe('403')
  })

  test('unsafe fetch .svg?import', async () => {
    await expect
      .poll(() => page.textContent('.unsafe-fetch-svg-status'))
      .toBe('403')
  })

  test('safe fs fetch', async () => {
    await expect
      .poll(() => page.textContent('.safe-fs-fetch'))
      .toBe(stringified)
    await expect
      .poll(() => page.textContent('.safe-fs-fetch-status'))
      .toBe('200')
  })

  test('safe fs fetch', async () => {
    await expect
      .poll(() => page.textContent('.safe-fs-fetch-query'))
      .toBe(stringified)
    await expect
      .poll(() => page.textContent('.safe-fs-fetch-query-status'))
      .toBe('200')
  })

  test('safe fs fetch with special characters', async () => {
    await expect
      .poll(() => page.textContent('.safe-fs-fetch-special-characters'))
      .toBe(stringified)
    await expect
      .poll(() => page.textContent('.safe-fs-fetch-special-characters-status'))
      .toBe('200')
  })

  test('unsafe fs fetch', async () => {
    await expect.poll(() => page.textContent('.unsafe-fs-fetch')).toBe('')
    await expect
      .poll(() => page.textContent('.unsafe-fs-fetch-status'))
      .toBe('403')
  })

  test('unsafe fs fetch', async () => {
    await expect.poll(() => page.textContent('.unsafe-fs-fetch-raw')).toBe('')
    await expect
      .poll(() => page.textContent('.unsafe-fs-fetch-raw-status'))
      .toBe('403')
  })

  test('unsafe fs fetch query 1', async () => {
    await expect
      .poll(() => page.textContent('.unsafe-fs-fetch-raw-query1'))
      .toBe('')
    await expect
      .poll(() => page.textContent('.unsafe-fs-fetch-raw-query1-status'))
      .toBe('403')
  })

  test('unsafe fs fetch query 2', async () => {
    await expect
      .poll(() => page.textContent('.unsafe-fs-fetch-raw-query2'))
      .toBe('')
    await expect
      .poll(() => page.textContent('.unsafe-fs-fetch-raw-query2-status'))
      .toBe('403')
  })

  test('unsafe fs fetch with special characters (#8498)', async () => {
    await expect.poll(() => page.textContent('.unsafe-fs-fetch-8498')).toBe('')
    await expect
      .poll(() => page.textContent('.unsafe-fs-fetch-8498-status'))
      .toBe('404')
  })

  test('unsafe fs fetch with special characters 2 (#8498)', async () => {
    await expect
      .poll(() => page.textContent('.unsafe-fs-fetch-8498-2'))
      .toBe('')
    await expect
      .poll(() => page.textContent('.unsafe-fs-fetch-8498-2-status'))
      .toBe('404')
  })

  test('unsafe fs fetch import inline', async () => {
    await expect
      .poll(() => page.textContent('.unsafe-fs-fetch-import-inline-status'))
      .toBe('403')
  })

  test('unsafe fs fetch import inline wasm init', async () => {
    await expect
      .poll(() =>
        page.textContent('.unsafe-fs-fetch-import-inline-wasm-init-status'),
      )
      .toBe('403')
  })

  test('unsafe fs fetch with relative path after query status', async () => {
    await expect
      .poll(() =>
        page.textContent('.unsafe-fs-fetch-relative-path-after-query-status'),
      )
      .toBe('403')
  })

  test('nested entry', async () => {
    await expect.poll(() => page.textContent('.nested-entry')).toBe('foobar')
  })

  test('denied', async () => {
    await expect.poll(() => page.textContent('.unsafe-dotenv')).toBe('403')
  })

  test('denied EnV casing', async () => {
    // It is 403 in case insensitive system, 404 in others
    await expect
      .poll(() => page.textContent('.unsafe-dotEnV-casing'))
      .toStrictEqual(expect.toBeOneOf(['403', '404']))
  })

  test('denied env with ?.svg?.wasm?init', async () => {
    await expect
      .poll(() => page.textContent('.unsafe-dotenv-query-dot-svg-wasm-init'))
      .toBe('403')
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

describe.runIf(isServe)('invalid request', () => {
  const sendRawRequest = async (baseUrl: string, requestTarget: string) => {
    return new Promise<string>((resolve, reject) => {
      const parsedUrl = new URL(baseUrl)

      const buf: Buffer[] = []
      const client = net.createConnection(
        { port: +parsedUrl.port, host: parsedUrl.hostname },
        () => {
          client.write(
            [
              `GET ${encodeURI(requestTarget)} HTTP/1.1`,
              `Host: ${parsedUrl.host}`,
              'Connection: Close',
              '\r\n',
            ].join('\r\n'),
          )
        },
      )
      client.on('data', (data) => {
        buf.push(data)
      })
      client.on('end', (hadError) => {
        if (!hadError) {
          resolve(Buffer.concat(buf).toString())
        }
      })
      client.on('error', (err) => {
        reject(err)
      })
    })
  }

  const root = path
    .resolve(__dirname.replace('playground', 'playground-temp'), '..')
    .replace(/\\/g, '/')

  test('request with sendRawRequest should work', async () => {
    const response = await sendRawRequest(viteTestUrl, '/src/safe.txt')
    expect(response).toContain('HTTP/1.1 200 OK')
    expect(response).toContain('KEY=safe')
  })

  test('request with sendRawRequest should work with /@fs/', async () => {
    const response = await sendRawRequest(
      viteTestUrl,
      path.posix.join('/@fs/', root, 'root/src/safe.txt'),
    )
    expect(response).toContain('HTTP/1.1 200 OK')
    expect(response).toContain('KEY=safe')
  })

  test('should reject request that has # in request-target', async () => {
    const response = await sendRawRequest(
      viteTestUrl,
      '/src/safe.txt#/../../unsafe.txt',
    )
    expect(response).toContain('HTTP/1.1 400 Bad Request')
  })

  test('should reject request that has # in request-target with /@fs/', async () => {
    const response = await sendRawRequest(
      viteTestUrl,
      path.posix.join('/@fs/', root, 'root/src/safe.txt') +
        '#/../../unsafe.txt',
    )
    expect(response).toContain('HTTP/1.1 400 Bad Request')
  })

  test('should deny request to denied file when a request has /.', async () => {
    const response = await sendRawRequest(viteTestUrl, '/src/dummy.crt/.')
    expect(response).toContain('HTTP/1.1 403 Forbidden')
  })

  test('should deny request with /@fs/ to denied file when a request has /.', async () => {
    const response = await sendRawRequest(
      viteTestUrl,
      path.posix.join('/@fs/', root, 'root/src/dummy.crt/') + '.',
    )
    expect(response).toContain('HTTP/1.1 403 Forbidden')
  })
})
