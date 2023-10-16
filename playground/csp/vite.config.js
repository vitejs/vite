import fs from 'node:fs/promises'
import url from 'node:url'
import path from 'node:path'
import crypto from 'node:crypto'
import { defineConfig } from 'vite'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

const createNonce = () => crypto.randomBytes(16).toString('base64')

/**
 * @param {import('node:http').ServerResponse} res
 * @param {string} nonceScript
 * @param {string} nonceStyle
 */
const setNonceHeader = (res, nonceScript, nonceStyle) => {
  res.setHeader(
    'Content-Security-Policy',
    `default-src 'nonce-${nonceScript}'; style-src 'nonce-${nonceStyle}'; connect-src 'self'`,
  )
}

/**
 * @param {string} htmlFile
 * @param {string} nonceScript
 * @param {string} nonceStyle
 */
const getNonceInjectedHtml = async (htmlFile, nonceScript, nonceStyle) => {
  const content = await fs.readFile(htmlFile, 'utf8')
  const tranformedContent = content
    .replaceAll('$@NONCE_SCRIPT@$', nonceScript)
    .replace('$@NONCE_STYLE@$', nonceStyle)
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
            const nonceScript = createNonce()
            const nonceStyle = createNonce()
            setNonceHeader(res, nonceScript, nonceStyle)
            const content = await getNonceInjectedHtml(
              path.join(__dirname, './index.html'),
              nonceScript,
              nonceStyle,
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

          const nonceScript = createNonce()
          const nonceStyle = createNonce()
          setNonceHeader(res, nonceScript, nonceStyle)
          const content = await getNonceInjectedHtml(
            path.join(__dirname, './dist/index.html'),
            nonceScript,
            nonceStyle,
          )
          res.end(content)
        })
      },
    },
  ],
})
