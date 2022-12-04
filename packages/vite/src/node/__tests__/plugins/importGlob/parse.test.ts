import { describe, expect, it } from 'vitest'
import { parseImportGlob } from '../../../plugins/importMetaGlob'

async function run(input: string) {
  const items = await parseImportGlob(
    input,
    process.cwd(),
    process.cwd(),
    (id) => id,
  )
  return items.map((i) => ({
    globs: i.globs,
    options: i.options,
    start: i.start,
  }))
}

async function runError(input: string) {
  try {
    await run(input)
  } catch (e) {
    return e
  }
}

describe('parse positives', async () => {
  it('basic', async () => {
    expect(
      await run(`
    import.meta.glob(\'./modules/*.ts\')
    `),
    ).toMatchInlineSnapshot(`
      [
        {
          "globs": [
            "./modules/*.ts",
          ],
          "options": {},
          "start": 5,
        },
      ]
    `)
  })

  it('array', async () => {
    expect(
      await run(`
    import.meta.glob([\'./modules/*.ts\', './dir/*.{js,ts}\'])
    `),
    ).toMatchInlineSnapshot(`
      [
        {
          "globs": [
            "./modules/*.ts",
            "./dir/*.{js,ts}",
          ],
          "options": {},
          "start": 5,
        },
      ]
    `)
  })

  it('options with multilines', async () => {
    expect(
      await run(`
    import.meta.glob([
      \'./modules/*.ts\',
      "!./dir/*.{js,ts}"
    ], {
      eager: true,
      import: 'named'
    })
    `),
    ).toMatchInlineSnapshot(`
      [
        {
          "globs": [
            "./modules/*.ts",
            "!./dir/*.{js,ts}",
          ],
          "options": {
            "eager": true,
            "import": "named",
          },
          "start": 5,
        },
      ]
    `)
  })

  it('options with multilines', async () => {
    expect(
      await run(`
    const modules = import.meta.glob(
      '/dir/**'
      // for test: annotation contain ")"
      /*
       * for test: annotation contain ")"
       * */
    )
    `),
    ).toMatchInlineSnapshot(`
      [
        {
          "globs": [
            "/dir/**",
          ],
          "options": {},
          "start": 21,
        },
      ]
    `)
  })

  it('options query', async () => {
    expect(
      await run(`
    const modules = import.meta.glob(
      '/dir/**',
      {
        query: {
          foo: 'bar',
          raw: true,
        }
      }
    )
    `),
    ).toMatchInlineSnapshot(`
      [
        {
          "globs": [
            "/dir/**",
          ],
          "options": {
            "query": {
              "foo": "bar",
              "raw": true,
            },
          },
          "start": 21,
        },
      ]
    `)
  })

  it('object properties - 1', async () => {
    expect(
      await run(`
    export const pageFiles = {
      '.page': import.meta.glob('/**/*.page.*([a-zA-Z0-9])')
};`),
    ).toMatchInlineSnapshot(`
  [
    {
      "globs": [
        "/**/*.page.*([a-zA-Z0-9])",
      ],
      "options": {},
      "start": 47,
    },
  ]
`)
  })

  it('object properties - 2', async () => {
    expect(
      await run(`
    export const pageFiles = {
      '.page': import.meta.glob('/**/*.page.*([a-zA-Z0-9])'),
};`),
    ).toMatchInlineSnapshot(`
  [
    {
      "globs": [
        "/**/*.page.*([a-zA-Z0-9])",
      ],
      "options": {},
      "start": 47,
    },
  ]
`)
  })

  it('object properties - 3', async () => {
    expect(
      await run(`
    export const pageFiles = {
      '.page.client': import.meta.glob('/**/*.page.client.*([a-zA-Z0-9])'),
      '.page.server': import.meta.glob('/**/*.page.server.*([a-zA-Z0-9])'),
};`),
    ).toMatchInlineSnapshot(`
  [
    {
      "globs": [
        "/**/*.page.client.*([a-zA-Z0-9])",
      ],
      "options": {},
      "start": 54,
    },
    {
      "globs": [
        "/**/*.page.server.*([a-zA-Z0-9])",
      ],
      "options": {},
      "start": 130,
    },
  ]
`)
  })

  it('array item', async () => {
    expect(
      await run(`
    export const pageFiles = [
      import.meta.glob('/**/*.page.client.*([a-zA-Z0-9])'),
      import.meta.glob('/**/*.page.server.*([a-zA-Z0-9])'),
    ]`),
    ).toMatchInlineSnapshot(`
      [
        {
          "globs": [
            "/**/*.page.client.*([a-zA-Z0-9])",
          ],
          "options": {},
          "start": 38,
        },
        {
          "globs": [
            "/**/*.page.server.*([a-zA-Z0-9])",
          ],
          "options": {},
          "start": 98,
        },
      ]
    `)
  })
})

describe('parse negatives', async () => {
  it('syntax error', async () => {
    expect(await runError('import.meta.glob(')).toMatchInlineSnapshot(
      '[SyntaxError: Unexpected token (1:17)]',
    )
  })

  it('empty', async () => {
    expect(await runError('import.meta.glob()')).toMatchInlineSnapshot(
      '[Error: Invalid glob import syntax: Expected 1-2 arguments, but got 0]',
    )
  })

  it('3 args', async () => {
    expect(
      await runError('import.meta.glob("", {}, {})'),
    ).toMatchInlineSnapshot(
      '[Error: Invalid glob import syntax: Expected 1-2 arguments, but got 3]',
    )
  })

  it('in string', async () => {
    expect(await runError('"import.meta.glob()"')).toBeUndefined()
  })

  it('variable', async () => {
    expect(await runError('import.meta.glob(hey)')).toMatchInlineSnapshot(
      '[Error: Invalid glob import syntax: Could only use literals]',
    )
  })

  it('template', async () => {
    expect(
      await runError('import.meta.glob(`hi ${hey}`)'),
    ).toMatchInlineSnapshot(
      '[Error: Invalid glob import syntax: Expected glob to be a string, but got dynamic template literal]',
    )
  })

  it('template with unicode', async () => {
    expect(await run('import.meta.glob(`/\u0068\u0065\u006c\u006c\u006f`)'))
      .toMatchInlineSnapshot(`
      [
        {
          "globs": [
            "/hello",
          ],
          "options": {},
          "start": 0,
        },
      ]
    `)
  })

  it('template without expressions', async () => {
    expect(await run('import.meta.glob(`/**/*.page.client.*([a-zA-Z0-9])`)'))
      .toMatchInlineSnapshot(`
      [
        {
          "globs": [
            "/**/*.page.client.*([a-zA-Z0-9])",
          ],
          "options": {},
          "start": 0,
        },
      ]
    `)
  })

  it('be string', async () => {
    expect(await runError('import.meta.glob(1)')).toMatchInlineSnapshot(
      '[Error: Invalid glob import syntax: Expected glob to be a string, but got "number"]',
    )
  })

  it('be array variable', async () => {
    expect(await runError('import.meta.glob([hey])')).toMatchInlineSnapshot(
      '[Error: Invalid glob import syntax: Could only use literals]',
    )
    expect(
      await runError('import.meta.glob(["1", hey])'),
    ).toMatchInlineSnapshot(
      '[Error: Invalid glob import syntax: Could only use literals]',
    )
  })

  it('options', async () => {
    expect(
      await runError('import.meta.glob("hey", hey)'),
    ).toMatchInlineSnapshot(
      '[Error: Invalid glob import syntax: Expected the second argument to be an object literal, but got "Identifier"]',
    )
    expect(await runError('import.meta.glob("hey", [])')).toMatchInlineSnapshot(
      '[Error: Invalid glob import syntax: Expected the second argument to be an object literal, but got "ArrayExpression"]',
    )
  })

  it('options props', async () => {
    expect(
      await runError('import.meta.glob("hey", { hey: 1 })'),
    ).toMatchInlineSnapshot('[Error: Unknown glob option "hey"]')
    expect(
      await runError('import.meta.glob("hey", { import: hey })'),
    ).toMatchInlineSnapshot(
      '[Error: Vite is unable to parse the glob options as the value is not static]',
    )
    expect(
      await runError('import.meta.glob("hey", { eager: 123 })'),
    ).toMatchInlineSnapshot(
      '[Error: Expected glob option "eager" to be of type boolean, but got number]',
    )
  })

  it('options query', async () => {
    expect(
      await runError('import.meta.glob("./*.js", { as: "raw", query: "hi" })'),
    ).toMatchInlineSnapshot(
      '[Error: Options "as" and "query" cannot be used together]',
    )
    expect(
      await runError('import.meta.glob("./*.js", { query: 123 })'),
    ).toMatchInlineSnapshot(
      '[Error: Expected glob option "query" to be of type object or string, but got number]',
    )
    expect(
      await runError('import.meta.glob("./*.js", { query: { foo: {} } })'),
    ).toMatchInlineSnapshot(
      '[Error: Expected glob option "query.foo" to be of type string, number, or boolean, but got object]',
    )
    expect(
      await runError('import.meta.glob("./*.js", { query: { foo: hey } })'),
    ).toMatchInlineSnapshot(
      '[Error: Vite is unable to parse the glob options as the value is not static]',
    )
    expect(
      await runError(
        'import.meta.glob("./*.js", { query: { foo: 123, ...a } })',
      ),
    ).toMatchInlineSnapshot(
      '[Error: Vite is unable to parse the glob options as the value is not static]',
    )
  })
})
