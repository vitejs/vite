import { beforeAll, expect } from 'vitest'
import { setupTest, sourcemapSnapshot } from './vitestSetupUtils'

// Vitest reruns this setup file for each test file, even with isolation disabled.
// Imported modules stay cached, so keep shared state in vitestSetupUtils.ts so
// setup and cached test-utils read the same live bindings.
// Each worker runs test files sequentially: setup updates values like testName,
// the file's tests and teardown finish, then the next file overwrites them.
// Parallel workers have separate module state.
// eslint-disable-next-line no-empty-pattern
beforeAll(async ({}, suite) => setupTest(suite))

const generateVisualizationLink = (code: string, map: string) => {
  const utf16ToUTF8 = (x: string) => {
    const bytes = new TextEncoder().encode(x)
    let result = ''
    for (let i = 0; i < bytes.length; i += 0x8000) {
      result += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
    }
    return result
  }
  const convertedCode = utf16ToUTF8(code)
  const convertedMap = utf16ToUTF8(map)
  const hash = `${convertedCode.length}\0${convertedCode}${convertedMap.length}\0${convertedMap}`
  return `https://evanw.github.io/source-map-visualization/#${btoa(hash)}`
}

expect.addSnapshotSerializer({
  serialize(val, config, indentation, depth, refs, printer) {
    const options = val[sourcemapSnapshot]
    const map = { ...val.map }
    if (options.withoutContent) {
      delete map.sourcesContent
    }

    return `${indentation}SourceMap {
${indentation}${config.indent}content: ${printer(map, config, indentation + config.indent, depth, refs)},
${indentation}${config.indent}visualization: ${JSON.stringify(generateVisualizationLink(val.code, JSON.stringify(val.map)))}
${indentation}}`
  },
  test(val) {
    return typeof val === 'object' && val && val[sourcemapSnapshot]
  },
})
