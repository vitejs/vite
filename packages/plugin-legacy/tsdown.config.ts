import { type UserConfig, defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  target: 'node20',
  dts: true,
  fixedExtension: false,
  deps: {
    onlyBundle: ['picocolors'],
  },
}) as UserConfig
