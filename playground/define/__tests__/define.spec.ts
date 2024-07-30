import { expect, test } from 'vitest'
import viteConfig from '../vite.config'
import { page } from '~utils'

const defines = viteConfig.define

test('string', async () => {
  expect(await page.textContent('.exp')).toBe(
    String(typeof eval(defines.__EXP__)),
  )
  expect(await page.textContent('.string')).toBe(JSON.parse(defines.__STRING__))
  expect(await page.textContent('.number')).toBe(String(defines.__NUMBER__))
  expect(await page.textContent('.boolean')).toBe(String(defines.__BOOLEAN__))
  expect(await page.textContent('.undefined')).toBe('')

  expect(await page.textContent('.object')).toBe(
    JSON.stringify(defines.__OBJ__, null, 2),
  )
  expect(await page.textContent('.process-node-env')).toBe(
    JSON.parse(defines['process.env.NODE_ENV']),
  )
  expect(await page.textContent('.process-env')).toBe(
    JSON.stringify(defines['process.env'], null, 2),
  )
  expect(await page.textContent('.env-var')).toBe(
    JSON.parse(defines['process.env.SOMEVAR']),
  )
  expect(await page.textContent('.process-as-property')).toBe(
    defines.__OBJ__.process.env.SOMEVAR,
  )
  expect(await page.textContent('.spread-object')).toBe(
    JSON.stringify({ SOMEVAR: defines['process.env.SOMEVAR'] }),
  )
  expect(await page.textContent('.spread-array')).toBe(
    JSON.stringify([...defines.__STRING__]),
  )
  expect(await page.textContent('.dollar-identifier')).toBe(
    String(defines.$DOLLAR),
  )
  expect(await page.textContent('.unicode-identifier')).toBe(
    String(defines.ÖUNICODE_LETTERɵ),
  )
  expect(await page.textContent('.no-identifier-substring')).toBe(String(true))
  expect(await page.textContent('.no-property')).toBe(String(true))
  // html wouldn't need to define replacement
  expect(await page.textContent('.exp-define')).toBe('__EXP__')
  expect(await page.textContent('.import-json')).toBe('__EXP__')
  expect(await page.textContent('.define-in-dep')).toBe(
    defines.__STRINGIFIED_OBJ__,
  )
})

test('ignores constants in string literals', async () => {
  expect(
    await page.textContent('.ignores-string-literals .process-env-dot'),
  ).toBe('process.env.')
  expect(
    await page.textContent('.ignores-string-literals .global-process-env-dot'),
  ).toBe('global.process.env.')
  expect(
    await page.textContent(
      '.ignores-string-literals .globalThis-process-env-dot',
    ),
  ).toBe('globalThis.process.env.')
  expect(
    await page.textContent('.ignores-string-literals .process-env-NODE_ENV'),
  ).toBe('process.env.NODE_ENV')
  expect(
    await page.textContent(
      '.ignores-string-literals .global-process-env-NODE_ENV',
    ),
  ).toBe('global.process.env.NODE_ENV')
  expect(
    await page.textContent(
      '.ignores-string-literals .globalThis-process-env-NODE_ENV',
    ),
  ).toBe('globalThis.process.env.NODE_ENV')
  expect(
    await page.textContent('.ignores-string-literals .import-meta-hot'),
  ).toBe('import' + '.meta.hot')
})

test('replaces constants in template literal expressions', async () => {
  expect(
    await page.textContent(
      '.replaces-constants-in-template-literal-expressions .process-env-dot',
    ),
  ).toBe(JSON.parse(defines['process.env.SOMEVAR']))
  expect(
    await page.textContent(
      '.replaces-constants-in-template-literal-expressions .process-env-NODE_ENV',
    ),
  ).toBe('dev')
})

test('replace constants on import.meta.env when it is a invalid json', async () => {
  expect(
    await page.textContent(
      '.replace-undefined-constants-on-import-meta-env .import-meta-env-UNDEFINED',
    ),
  ).toBe('undefined')
  expect(
    await page.textContent(
      '.replace-undefined-constants-on-import-meta-env .import-meta-env-SOME_IDENTIFIER',
    ),
  ).toBe('true')
})
