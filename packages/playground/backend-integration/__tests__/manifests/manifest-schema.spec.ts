import Ajv2020 from 'ajv/dist/2020'

const ajv = new Ajv2020()
const validate = ajv.compile(
  require('../../../../vite/schemas/manifest.schema.json')
)

describe('manifest', () => {
  test('validation succeeds with valid manifests', () => {
    const manifest = require('./valid.manifest.json')
    const result = validate(manifest)
    expect(result).toBeTruthy()
  })

  test('validation fails with invalid manifests', () => {
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
