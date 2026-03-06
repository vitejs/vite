import net from 'node:net'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { isServe, isWindows, viteTestUrl } from '~utils'
import './commonTests'

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
    .resolve(import.meta.dirname.replace('playground', 'playground-temp'), '..')
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

  test('should deny request to denied file when a request ends with \\', async () => {
    const response = await sendRawRequest(viteTestUrl, '/src/.env\\')
    expect(response).toContain(
      isWindows ? 'HTTP/1.1 403 Forbidden' : 'HTTP/1.1 404 Not Found',
    )
  })

  test('should deny request to denied file when a request ends with \\ with /@fs/', async () => {
    const response = await sendRawRequest(
      viteTestUrl,
      path.posix.join('/@fs/', root, 'root/src/.env') + '\\',
    )
    expect(response).toContain(
      isWindows ? 'HTTP/1.1 403 Forbidden' : 'HTTP/1.1 404 Not Found',
    )
  })

  test('should deny request with /@fs/ to denied file when a request has /.', async () => {
    const response = await sendRawRequest(
      viteTestUrl,
      path.posix.join('/@fs/', root, 'root/src/dummy.crt/') + '.',
    )
    expect(response).toContain('HTTP/1.1 403 Forbidden')
  })

  test('should deny request to HTML file outside root by default with relative path', async () => {
    const response = await sendRawRequest(viteTestUrl, '/../unsafe.html')
    expect(response).toContain('HTTP/1.1 403 Forbidden')
  })
})
