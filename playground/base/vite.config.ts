import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  input:
    command === 'serve'
      ? [
          path.resolve(import.meta.dirname, 'index.html'),
          path.resolve(import.meta.dirname, 'foobar/a.js'),
        ]
      : undefined,
  // no trailing slash on purpose: `rawBase` keeps the value as-is, so the
  // base middleware must only match whole path segments
  base: '/foo',
}))
