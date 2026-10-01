import { defineConfig, type Plugin } from 'vite'

// Lets a spec hold the HMR task for page-b.js inside `transform`.
export const holdPageB = { hold: null as Promise<void> | null, holding: false }

const holdPageBPlugin: Plugin = {
  name: 'hold-page-b',
  api: holdPageB,
  async transform(_code, id) {
    if (!id.endsWith('/page-b.js') || !holdPageB.hold) return
    holdPageB.holding = true
    await holdPageB.hold
    holdPageB.holding = false
  },
}

// Lazy compilation only exists in bundled dev, so this playground always runs
// with it on, also under plain `pnpm test-serve`.
export default defineConfig({
  plugins: [holdPageBPlugin],
  experimental: {
    bundledDev: true,
  },
})
