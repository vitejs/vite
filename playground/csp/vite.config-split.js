import { defineConfig } from 'vite'
import {
  createCspPlugin,
  createNonce,
  noncePlaceholder,
} from './vite.config.js'

const outDir = 'dist/split'
const scriptNoncePlaceholder = '#$SCRIPT_NONCE$#'
const styleNoncePlaceholder = '#$STYLE_NONCE$#'

export default defineConfig({
  build: {
    outDir,
  },
  plugins: [
    createCspPlugin({
      name: 'nonce-inject-split',
      cspNonce: {
        script: scriptNoncePlaceholder,
        style: styleNoncePlaceholder,
      },
      distDir: outDir,
      prepare(res) {
        const scriptNonce = createNonce()
        const styleNonce = createNonce()
        res.setHeader(
          'Content-Security-Policy',
          `script-src 'nonce-${scriptNonce}'; style-src 'nonce-${styleNonce}'; connect-src 'self'`,
        )
        return (html) =>
          html
            .replaceAll(scriptNoncePlaceholder, scriptNonce)
            .replaceAll(styleNoncePlaceholder, styleNonce)
            // `index.html` hardcodes this one on a script, to check that an
            // existing nonce attribute is left alone
            .replaceAll(noncePlaceholder, scriptNonce)
      },
    }),
  ],
})
