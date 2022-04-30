import Ajv2020 from 'ajv/dist/2020'

const schema = require('vite/schemas/manifest.schema.json')
const ajv = new Ajv2020()
const validate = ajv.compile(schema)

describe('manifest json schema', () => {
  test('valid manifest validates against manifest schema', () => {
    const manifest = require('./valid.manifest.json')
    const result = validate(manifest)
    expect(result).toBeTruthy()
  })

  test('invalid manifest does not validate against manifest schema', () => {
    const manifest = require('./invalid.manifest.json')
    const result = validate(manifest)
    expect(result).toBeFalsy()
  })

  test('manifest chunks support additional properties', () => {
    const manifest = require('./additionalProperties.manifest.json')
    const result = validate(manifest)
    expect(result).toBeTruthy()
  })
})
