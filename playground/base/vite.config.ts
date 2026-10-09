import { defineConfig } from 'vite'

export default defineConfig({
  // no trailing slash on purpose: `rawBase` keeps the value as-is, so the
  // base middleware must only match whole path segments
  base: '/foo',
})
