import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { defineConfig } from 'vite'

export const noncePlaceholder = '#$NONCE$#'
export const createNonce = () => crypto.randomBytes(16).toString('base64')

/**
 * The CSP playgrounds serve `index.html` themselves so that a fresh nonce can be
 * generated per request, which is what the option is meant to be used with.
 *
 * `prepare` sets the policy header for one request and returns the replacer that
 * substitutes the placeholders in the HTML with the nonces it just generated.
 *
 * @param {object} options
 * @param {string} options.name
 * @param {import('vite').UserConfig['html']['cspNonce']} options.cspNonce
 * @param {string} options.distDir
 * @param {(res: import('node:http').ServerResponse) => (html: string) => string} options.prepare
 * @returns {import('vite').Plugin}
 */
export const createCspPlugin = ({ name, cspNonce, distDir, prepare }) => {
  /**
   * @param {string} file
   * @param {(input: string, originalUrl: string) => Promise<string>} transform
   * @returns {import('vite').Connect.NextHandleFunction}
   */
  const createMiddleware = (file, transform) => async (req, res) => {
    const replaceNonces = prepare(res)
    const content = await fs.readFile(
      path.join(import.meta.dirname, file),
      'utf-8',
    )
    const transformedContent = await transform(content, req.originalUrl)
    res.setHeader('Content-Type', 'text/html')
    res.end(replaceNonces(transformedContent))
  }

  return {
    name,
    config() {
      return { appType: 'custom', html: { cspNonce } }
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
          createMiddleware(`./${distDir}/index.html`, async (input) => input),
        )
      }
    },
  }
}

export default defineConfig({
  build: {
    // the dist directory is shared with vite.config-split.js
    emptyOutDir: false,
  },
  plugins: [
    createCspPlugin({
      name: 'nonce-inject',
      cspNonce: noncePlaceholder,
      distDir: 'dist',
      prepare(res) {
        const nonce = createNonce()
        res.setHeader(
          'Content-Security-Policy',
          `default-src 'nonce-${nonce}'; connect-src 'self'`,
        )
        return (html) => html.replaceAll(noncePlaceholder, nonce)
      },
    }),
  ],
})
