import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { isServe, isWindows, viteTestUrl } from '~utils'
import './commonTests'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
  const testCases: Array<{
    name: string
    target: string
    status: string
    content?: string
  }> = [
    {
      name: 'basic request',
      target: '/src/safe.txt',
      status: 'HTTP/1.1 200 OK',
      content: 'KEY=safe',
    },
    {
      name: 'request with /@fs/',
      target: path.posix.join('/@fs/', root, 'root/src/safe.txt'),
      status: 'HTTP/1.1 200 OK',
      content: 'KEY=safe',
    },
    {
      name: '# in request-target',
      target: '/src/safe.txt#/../../unsafe.txt',
      status: 'HTTP/1.1 400 Bad Request',
    },
    {
      name: '# in request-target with /@fs/',
      target:
        path.posix.join('/@fs/', root, 'root/src/safe.txt') +
        '#/../../unsafe.txt',
      status: 'HTTP/1.1 400 Bad Request',
    },
    {
      name: 'denied file with /.',
      target: '/src/dummy.crt/.',
      status: 'HTTP/1.1 403 Forbidden',
    },
    {
      name: 'denied file ending with \\',
      target: '/src/.env\\',
      status: isWindows ? 'HTTP/1.1 403 Forbidden' : 'HTTP/1.1 404 Not Found',
    },
    {
      name: 'denied file ending with \\ with /@fs/',
      target: path.posix.join('/@fs/', root, 'root/src/.env') + '\\',
      status: isWindows ? 'HTTP/1.1 403 Forbidden' : 'HTTP/1.1 404 Not Found',
    },
    {
      name: 'denied file with /. with /@fs/',
      target: path.posix.join('/@fs/', root, 'root/src/dummy.crt/') + '.',
      status: 'HTTP/1.1 403 Forbidden',
    },
    {
      name: 'HTML outside root with relative path',
      target: '/../unsafe.html',
      status: 'HTTP/1.1 403 Forbidden',
    },
  ]
  for (const { name, target, status, content } of testCases) {
    test(name, async () => {
      const response = await sendRawRequest(viteTestUrl, target)
      expect(response).toContain(status)
      if (content !== undefined) {
        expect(response).toContain(content)
      }
    })
  }
})
