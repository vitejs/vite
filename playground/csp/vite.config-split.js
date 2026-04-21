import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { defineConfig } from 'vite'

const sharedNoncePlaceholder = '#$NONCE$#'
const scriptNoncePlaceholder = '#$SCRIPT_NONCE$#'
const styleNoncePlaceholder = '#$STYLE_NONCE$#'
const createNonce = () => crypto.randomBytes(16).toString('base64')

/**
 * @param {import('node:http').ServerResponse} res
 * @param {string} scriptNonce
 * @param {string} styleNonce
 */
const setNonceHeader = (res, scriptNonce, styleNonce) => {
  res.setHeader(
    'Content-Security-Policy',
    `script-src 'nonce-${scriptNonce}'; style-src 'nonce-${styleNonce}'; connect-src 'self'`,
  )
}

/**
 * @param {string} file
 * @param {(input: string, originalUrl: string) => Promise<string>} transform
 * @returns {import('vite').Connect.NextHandleFunction}
 */
const createMiddleware = (file, transform) => async (req, res) => {
  const scriptNonce = createNonce()
  const styleNonce = createNonce()
  setNonceHeader(res, scriptNonce, styleNonce)
  const content = await fs.readFile(
    path.join(import.meta.dirname, file),
    'utf-8',
  )
  const transformedContent = await transform(content, req.originalUrl)
  res.setHeader('Content-Type', 'text/html')
  res.end(
    transformedContent
      .replaceAll(sharedNoncePlaceholder, scriptNonce)
      .replaceAll(scriptNoncePlaceholder, scriptNonce)
      .replaceAll(styleNoncePlaceholder, styleNonce),
  )
}

export default defineConfig({
  build: {
    outDir: 'dist-split',
  },
  plugins: [
    {
      name: 'nonce-inject-split',
      config() {
        return {
          appType: 'custom',
          html: {
            cspNonce: {
              script: scriptNoncePlaceholder,
              style: styleNoncePlaceholder,
            },
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
            createMiddleware('./dist-split/index.html', async (input) => input),
          )
        }
      },
    },
  ],
})
