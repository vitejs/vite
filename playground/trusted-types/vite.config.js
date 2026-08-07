import fs from 'node:fs/promises'
import path from 'node:path'
import url from 'node:url'
import crypto from 'node:crypto'
import { defineConfig } from 'vite'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

const noncePlaceholder = '#$NONCE$#'
const createNonce = () => crypto.randomBytes(16).toString('base64')

/**
 * @param {import('node:http').ServerResponse} res
 * @param {string} nonce
 */
const setTrustedTypesHeader = (res, nonce) => {
  // CSP with Trusted Types enforcement
  // - require-trusted-types-for 'script': enforces trusted types for script URLs
  // - trusted-types vite-hmr: allows the vite-hmr policy that Vite creates
  res.setHeader(
    'Content-Security-Policy',
    `require-trusted-types-for 'script'; trusted-types vite-hmr; default-src 'self'; script-src 'nonce-${nonce}' 'strict-dynamic'; connect-src 'self' ws: wss:; worker-src blob:`,
  )
}

/**
 * @param {string} file
 * @param {(input: string, originalUrl: string) => Promise<string>} transform
 * @returns {import('vite').Connect.NextHandleFunction}
 */
const createMiddleware = (file, transform) => async (req, res) => {
  const nonce = createNonce()
  setTrustedTypesHeader(res, nonce)
  const content = await fs.readFile(path.join(__dirname, file), 'utf-8')
  const transformedContent = await transform(content, req.originalUrl)
  res.setHeader('Content-Type', 'text/html')
  res.end(transformedContent.replaceAll(noncePlaceholder, nonce))
}

export default defineConfig({
  plugins: [
    {
      name: 'trusted-types-csp',
      config() {
        return {
          appType: 'custom',
          html: {
            cspNonce: noncePlaceholder,
          },
        }
      },
      configureServer({ transformIndexHtml, middlewares }) {
        return () => {
          middlewares.use(
            createMiddleware('./index.html', (input, originalUrl) =>
              transformIndexHtml(originalUrl, input),
            ),
          )
        }
      },
      configurePreviewServer({ middlewares }) {
        return () => {
          middlewares.use(
            createMiddleware('./dist/index.html', async (input) => input),
          )
        }
      },
    },
  ],
})
