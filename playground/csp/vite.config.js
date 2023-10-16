import fs from 'node:fs/promises'
import url from 'node:url'
import path from 'node:path'
import crypto from 'node:crypto'
import { defineConfig } from 'vite'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

const createNonce = () => crypto.randomUUID().replaceAll('-', '')

/**
 * @param {import('node:http').ServerResponse} res
 * @param {string} nonce
 */
const setNonceHeader = (res, nonce) => {
  res.setHeader(
    'Content-Security-Policy',
    `default-src 'nonce-${nonce}'; connect-src 'self'`,
  )
}

/**
 * @param {string} htmlFile
 * @param {string} nonce
 */
const getNonceInjectedHtml = async (htmlFile, nonce) => {
  const content = await fs.readFile(htmlFile, 'utf8')
  const tranformedContent = content
    .replace(/<script\s*/g, `$&nonce="${nonce}" `)
    .replace(/<link\s*/g, `$&nonce="${nonce}" `)
  return tranformedContent
}

export default defineConfig({
  plugins: [
    {
      name: 'nonce-inject',
      config() {
        return { appType: 'custom' }
      },
      configureServer({ transformIndexHtml, middlewares }) {
        return () => {
          middlewares.use(async (req, res) => {
            const nonce = createNonce()
            setNonceHeader(res, nonce)
            const content = await getNonceInjectedHtml(
              path.join(__dirname, './index.html'),
              nonce,
            )
            res.end(await transformIndexHtml(req.originalUrl, content))
          })
        }
      },
      configurePreviewServer({ middlewares }) {
        middlewares.use(async (req, res, next) => {
          const { pathname } = new URL(req.url, 'http://example.com')
          const assetPath = path.join(__dirname, 'dist', `.${pathname}`)
          try {
            if ((await fs.stat(assetPath)).isFile()) {
              next()
              return
            }
          } catch {}

          const nonce = createNonce()
          setNonceHeader(res, nonce)
          const content = await getNonceInjectedHtml(
            path.join(__dirname, './dist/index.html'),
            nonce,
          )
          res.end(content)
        })
      },
    },
  ],
})
