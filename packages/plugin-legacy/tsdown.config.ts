import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  target: 'node20',
  tsconfig: false, // disable tsconfig `paths` when bundling
  outputOptions(opts, format) {
    if (format === 'cjs') {
      opts.exports = 'named'
    }
    return opts
  },
})
