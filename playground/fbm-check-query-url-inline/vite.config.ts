import { defineConfig } from 'vite'

// Faithful FBM port of Vite's `?url&inline` / `?url&no-inline` query-suffix COMBINATIONS
// (Section 4 of GOAL.md: "`?url&inline`, `?url&no-inline` are combinations").
//
// Vite refs (playground/assets):
//   - `?url&inline`  -> `test('?inline public json import')` (assets.spec.ts L529-533): the
//     exact `?url&inline` combo, `import inlinePublicJson from '/foo.json?url&inline'`
//     (index.html L578-579), asserted to be `/^data:application\/json;base64,/` (a data URI).
//   - `?url&no-inline` -> Vite has NO exact `?url&no-inline` test; the closest real cases are
//     `test('?no-inline svg import')` (L501-507) and `test('?url import')` (L535-542). We port
//     the closest case: `?url&no-inline` forces the emitted-asset URL path (like `?no-inline`
//     /`?url`).
//
// The ONLY intended change vs. the non-FBM playground is enabling FBM.
export default defineConfig({
  experimental: {
    bundledDev: true,
  },
})
