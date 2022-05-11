import { describe, expect, it } from 'vitest'
import { parseImportGlob } from '../../../plugins/importMetaGlob'

async function run(input: string) {
  const items = await parseImportGlob(
    input,
    process.cwd(),
    process.cwd(),
    (id) => id
  )
  return items.map((i) => ({ globs: i.globs, options: i.options }))
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
    import.meta.importGlob(\'./modules/*.ts\')
    `)
    ).toMatchInlineSnapshot('[]')
  })

  it('array', async () => {
    expect(
      await run(`
    import.meta.importGlob([\'./modules/*.ts\', './dir/*.{js,ts}\'])
    `)
    ).toMatchInlineSnapshot('[]')
  })

  it('options with multilines', async () => {
    expect(
      await run(`
    import.meta.importGlob([
      \'./modules/*.ts\',
      "!./dir/*.{js,ts}"
    ], {
      eager: true,
      import: 'named'
    })
    `)
    ).toMatchInlineSnapshot('[]')
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
    `)
    ).toMatchInlineSnapshot(`
      [
        {
          "globs": [
            "/dir/**",
          ],
          "options": {},
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
    `)
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
        },
      ]
    `)
  })
})

describe('parse negatives', async () => {
  it('syntax error', async () => {
    expect(await runError('import.meta.importGlob(')).toMatchInlineSnapshot(
      'undefined'
    )
  })

  it('empty', async () => {
    expect(await runError('import.meta.importGlob()')).toMatchInlineSnapshot(
      'undefined'
    )
  })

  it('3 args', async () => {
    expect(
      await runError('import.meta.importGlob("", {}, {})')
    ).toMatchInlineSnapshot('undefined')
  })

  it('in string', async () => {
    expect(await runError('"import.meta.importGlob()"')).toBeUndefined()
  })

  it('variable', async () => {
    expect(await runError('import.meta.importGlob(hey)')).toMatchInlineSnapshot(
      'undefined'
    )
  })

  it('template', async () => {
    // eslint-disable-next-line no-template-curly-in-string
    expect(
      await runError('import.meta.importGlob(`hi ${hey}`)')
    ).toMatchInlineSnapshot('undefined')
  })

  it('be string', async () => {
    expect(await runError('import.meta.importGlob(1)')).toMatchInlineSnapshot(
      'undefined'
    )
  })

  it('be array variable', async () => {
    expect(
      await runError('import.meta.importGlob([hey])')
    ).toMatchInlineSnapshot('undefined')
    expect(
      await runError('import.meta.importGlob(["1", hey])')
    ).toMatchInlineSnapshot('undefined')
  })

  it('options', async () => {
    expect(
      await runError('import.meta.importGlob("hey", hey)')
    ).toMatchInlineSnapshot('undefined')
    expect(
      await runError('import.meta.importGlob("hey", [])')
    ).toMatchInlineSnapshot('undefined')
  })

  it('options props', async () => {
    expect(
      await runError('import.meta.importGlob("hey", { hey: 1 })')
    ).toMatchInlineSnapshot('undefined')
    expect(
      await runError('import.meta.importGlob("hey", { import: hey })')
    ).toMatchInlineSnapshot('undefined')
    expect(
      await runError('import.meta.importGlob("hey", { eager: 123 })')
    ).toMatchInlineSnapshot('undefined')
  })

  it('options query', async () => {
    expect(
      await runError(
        'import.meta.importGlob("./*.js", { as: "raw", query: "hi" })'
      )
    ).toMatchInlineSnapshot('undefined')
    expect(
      await runError('import.meta.importGlob("./*.js", { query: 123 })')
    ).toMatchInlineSnapshot('undefined')
    expect(
      await runError('import.meta.importGlob("./*.js", { query: { foo: {} } })')
    ).toMatchInlineSnapshot('undefined')
    expect(
      await runError(
        'import.meta.importGlob("./*.js", { query: { foo: hey } })'
      )
    ).toMatchInlineSnapshot('undefined')
    expect(
      await runError(
        'import.meta.importGlob("./*.js", { query: { foo: 123, ...a } })'
      )
    ).toMatchInlineSnapshot('undefined')
  })
})
