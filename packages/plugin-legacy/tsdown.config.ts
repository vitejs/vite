import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  target: 'node20',
  tsconfig: false, // disable tsconfig `paths` when bundling
  dts: true,
})
