import { describe, expect, test } from 'vitest'
import {
  type JsonOptions,
  extractJsonErrorPosition,
  jsonPlugin,
} from '../../plugins/json'

const getErrorMessage = (input: string) => {
  try {
    JSON.parse(input)
    throw new Error('No error happened')
  } catch (e) {
    return e.message
  }
}

test('can extract json error position', () => {
  const cases = [
    { input: '{', expectedPosition: 0 },
    { input: '{},', expectedPosition: 1 },
    { input: '"f', expectedPosition: 1 },
    { input: '[', expectedPosition: 0 },
  ]

  for (const { input, expectedPosition } of cases) {
    expect(extractJsonErrorPosition(getErrorMessage(input), input.length)).toBe(
      expectedPosition,
    )
  }
})

describe('transform', () => {
  const transform = (
    input: string,
    opts: Required<JsonOptions>,
    isBuild: boolean,
  ) => {
    const plugin = jsonPlugin(opts, isBuild)
    return (plugin.transform! as Function)(input, 'test.json').code
  }

  test("namedExports: true, stringify: 'auto' should not transformed an array input", () => {
    const actualSmall = transform(
      '[{"a":1,"b":2}]',
      { namedExports: true, stringify: 'auto' },
      false,
    )
    expect(actualSmall).toMatchInlineSnapshot(`
"export default [
	{
		a: 1,
		b: 2
	}
];"
    `)
  })

  test('namedExports: true, stringify: true should not transformed an array input', () => {
    const actualSmall = transform(
      '[{"a":1,"b":2}]',
      { namedExports: true, stringify: true },
      false,
    )
    expect(actualSmall).toMatchInlineSnapshot(
      `"export default JSON.parse("[{\\"a\\":1,\\"b\\":2}]")"`,
    )
  })

  test('namedExports: true, stringify: false', () => {
    const actual = transform(
      '{"a":1,\n"🫠": "",\n"const": false}',
      { namedExports: true, stringify: false },
      false,
    )
    expect(actual).toMatchInlineSnapshot(`
      "export const a = 1;
      export default {
      	a: a,
      	"🫠": "",
      	"const": false
      };
      "
    `)
  })

  test('namedExports: false, stringify: false', () => {
    const actual = transform(
      '{"a":1,\n"🫠": "",\n"const": false}',
      { namedExports: false, stringify: false },
      false,
    )
    expect(actual).toMatchInlineSnapshot(`
      "export default {
      	a: 1,
      	"🫠": "",
      	"const": false
      };"
    `)
  })

  test('namedExports: true, stringify: true', () => {
    const actual = transform(
      '{"a":1,\n"🫠": "",\n"const": false}',
      { namedExports: true, stringify: true },
      false,
    )
    expect(actual).toMatchInlineSnapshot(`
      "export const a = 1;
      export default {
        a,
        "🫠": "",
        "const": false,
      };
      "
    `)
  })

  test('namedExports: false, stringify: true', () => {
    const actualDev = transform(
      '{"a":1,\n"🫠": "",\n"const": false}',
      { namedExports: false, stringify: true },
      false,
    )
    expect(actualDev).toMatchInlineSnapshot(
      `"export default JSON.parse("{\\"a\\":1,\\n\\"🫠\\": \\"\\",\\n\\"const\\": false}")"`,
    )

    const actualBuild = transform(
      '{"a":1,\n"🫠": "",\n"const": false}',
      { namedExports: false, stringify: true },
      true,
    )
    expect(actualBuild).toMatchInlineSnapshot(
      `"export default JSON.parse("{\\"a\\":1,\\"🫠\\":\\"\\",\\"const\\":false}")"`,
    )
  })

  test("namedExports: true, stringify: 'auto'", () => {
    const actualSmall = transform(
      '{"a":1,\n"🫠": "",\n"const": false}',
      { namedExports: true, stringify: 'auto' },
      false,
    )
    expect(actualSmall).toMatchInlineSnapshot(`
      "export const a = 1;
      export default {
        a,
        "🫠": "",
        "const": false,
      };
      "
    `)
    const actualLargeNonObject = transform(
      `{"a":1,\n"🫠": "${'vite'.repeat(3000)}",\n"const": false}`,
      { namedExports: true, stringify: 'auto' },
      false,
    )
    expect(actualLargeNonObject).not.toContain('JSON.parse(')

    const actualLarge = transform(
      `{"a":1,\n"🫠": {\n"foo": "${'vite'.repeat(3000)}"\n},\n"const": false}`,
      { namedExports: true, stringify: 'auto' },
      false,
    )
    expect(actualLarge).toContain('JSON.parse(')
  })
})
