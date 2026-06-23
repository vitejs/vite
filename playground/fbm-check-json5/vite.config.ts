import { defineConfig } from 'vite'

// Faithful FBM port of Vite's `.json` case (playground/json), adapted to `.json5`.
// Vite has no dedicated `.json5` playground/spec — the `.json5` lang is only declared via
// `jsonLangs` (packages/vite/src/node/plugins/json.ts:16). So this ports the closest real
// case: the `.json` default-import + named-import + HMR full-reload pattern, using genuine
// JSON5-only syntax so a plain JSON.parse could not produce the value.
// The ONLY intended change vs. the non-FBM playground is enabling FBM.
export default defineConfig({
  experimental: {
    bundledDev: true,
  },
})
