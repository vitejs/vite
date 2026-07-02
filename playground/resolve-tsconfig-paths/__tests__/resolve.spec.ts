import { expect, test } from 'vitest'
import { getColor, page } from '~utils'

test('import from .ts', async () => {
  await expect.poll(() => page.textContent('.ts')).toMatch('[success]')
})

test('import from .js', async () => {
  await expect.poll(() => page.textContent('.js')).toMatch('[success]')
})

test('import using # prefixed path', async () => {
  await expect.poll(() => page.textContent('.hash')).toMatch('[success]')
})

test('fallback works', async () => {
  await expect.poll(() => page.textContent('.fallback')).toMatch('[success]')
})

test('nested tsconfig.json & references / include works', async () => {
  await expect.poll(() => page.textContent('.nested-a')).toMatch('[success]')
  await expect.poll(() => page.textContent('.nested-b')).toMatch('[success]')
})

test('css @import resolves tsconfig paths', async () => {
  await expect.poll(() => getColor('.tsconfig-paths-css')).toBe('darkcyan')
})

test('sass @use resolves tsconfig paths', async () => {
  await expect.poll(() => getColor('.tsconfig-paths-scss')).toBe('seagreen')
})

// `resolve.tsconfigPaths` is not supported inside `.less` files. The aliased
// `@import (optional) '@/less-imported.less'` cannot resolve (even with
// `**/*.less` in `include`), so it is skipped and the color stays `navy`.
test('less @import does not resolve tsconfig paths (unsupported)', async () => {
  await expect.poll(() => getColor('.tsconfig-paths-less')).toBe('navy')
})
