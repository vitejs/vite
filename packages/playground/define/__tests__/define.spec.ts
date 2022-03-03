test('string', async () => {
  const defines = require('../vite.config.js').define

  expect(await page.textContent('.exp')).toBe(String(eval(defines.__EXP__)))
  expect(await page.textContent('.string')).toBe(JSON.parse(defines.__STRING__))
  expect(await page.textContent('.number')).toBe(String(defines.__NUMBER__))
  expect(await page.textContent('.boolean')).toBe(String(defines.__BOOLEAN__))
  expect(await page.textContent('.object')).toBe(
    JSON.stringify(defines.__OBJ__, null, 2)
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
  expect(await page.textContent('.import-file')).not.toBe(
    `import * from "${defines.__IMPORT_FILE_NAME__}"`
  )
  expect(await page.textContent('.export-file')).not.toBe(
    `export * from "${defines.__EXPORT_FILE_NAME__}"`
  )
  expect(await page.textContent('.path')).not.toBe(
    `import * from "xxxx/${defines.PATH}"`
  )
})
