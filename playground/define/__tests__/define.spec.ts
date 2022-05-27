import viteConfig from '../vite.config'
import { page } from '~utils'

test('string', async () => {
  const defines = viteConfig.define

  expect(await page.textContent('.exp')).toBe(
    String(typeof eval(defines.__EXP__))
  )
  expect(await page.textContent('.string')).toBe(JSON.parse(defines.__STRING__))
  expect(await page.textContent('.number')).toBe(String(defines.__NUMBER__))
  expect(await page.textContent('.boolean')).toBe(String(defines.__BOOLEAN__))

  expect(await page.textContent('.object')).toBe(
    JSON.stringify(defines.__OBJ__, null, 2)
  )
  expect(await page.textContent('.process-node-env')).toBe(
    JSON.parse(defines['process.env.NODE_ENV'])
  )
  expect(await page.textContent('.env-var')).toBe(
    JSON.parse(defines['process.env.SOMEVAR'])
  )
  expect(await page.textContent('.process-as-property')).toBe(
    defines.__OBJ__.process.env.SOMEVAR
  )
  expect(await page.textContent('.spread-object')).toBe(
    JSON.stringify({ SOMEVAR: defines['process.env.SOMEVAR'] })
  )
  expect(await page.textContent('.spread-array')).toBe(
    JSON.stringify([...defines.__STRING__])
  )
  expect(await page.textContent('.dollar-identifier')).toBe(
    String(defines.$DOLLAR)
  )
  expect(await page.textContent('.unicode-identifier')).toBe(
    String(defines.ÖUNICODE_LETTERɵ)
  )
  expect(await page.textContent('.no-identifier-substring')).toBe(String(true))
  expect(await page.textContent('.no-property')).toBe(String(true))
  // html would't need to define replacement
  expect(await page.textContent('.exp-define')).toBe('__EXP__')
  expect(await page.textContent('.import-json')).toBe('__EXP__')
})
