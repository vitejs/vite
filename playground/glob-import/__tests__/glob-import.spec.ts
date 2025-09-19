import path from 'node:path'
import { readdir } from 'node:fs/promises'
import { expect, test } from 'vitest'
import {
  addFile,
  editFile,
  findAssetFile,
  isBuild,
  page,
  removeFile,
} from '~utils'

const filteredResult = {
  './alias.js': {
    default: 'hi',
  },
  './foo.js': {
    msg: 'foo',
  },
  "./quote'.js": {
    msg: 'single-quote',
  },
}

const json = {
  msg: 'baz',
  default: {
    msg: 'baz',
  },
}

const globWithAlias = {
  '/dir/alias.js': {
    default: 'hi',
  },
}

const allResult = {
  // JSON file should be properly transformed
  '/dir/alias.js': {
    default: 'hi',
  },
  '/dir/baz.json': json,
  '/dir/foo.css': {},
  '/dir/foo.js': {
    msg: 'foo',
  },
  '/dir/index.js': isBuild
    ? {
        modules: filteredResult,
        globWithAlias,
      }
    : {
        globWithAlias,
        modules: filteredResult,
      },
  '/dir/nested/bar.js': {
    modules: {
      '../baz.json': json,
    },
    msg: 'bar',
  },
  "/dir/quote'.js": {
    msg: 'single-quote',
  },
}

const nodeModulesResult = {
  '/dir/node_modules/hoge.js': { msg: 'hoge' },
}

const rawResult = {
  '/dir/baz.json': {
    msg: 'baz',
  },
}

const relativeRawResult = {
  './dir/baz.json': {
    msg: 'baz',
  },
}

const baseRawResult = {
  './baz.json': {
    msg: 'baz',
  },
}

test('should work', async () => {
  await expect
    .poll(async () => JSON.parse(await page.textContent('.result')))
    .toStrictEqual(allResult)
  await expect
    .poll(async () => JSON.parse(await page.textContent('.result-eager')))
    .toStrictEqual(allResult)
  await expect
    .poll(async () =>
      JSON.parse(await page.textContent('.result-node_modules')),
    )
    .toStrictEqual(nodeModulesResult)
})

test('import glob raw', async () => {
  expect(await page.textContent('.globraw')).toBe(
    JSON.stringify(rawResult, null, 2),
  )
})

test('import property access', async () => {
  expect(await page.textContent('.property-access')).toBe(
    JSON.stringify(rawResult['/dir/baz.json'], null, 2),
  )
})

test('import relative glob raw', async () => {
  expect(await page.textContent('.relative-glob-raw')).toBe(
    JSON.stringify(relativeRawResult, null, 2),
  )
})

test('unassigned import processes', async () => {
  expect(await page.textContent('.side-effect-result')).toBe(
    'Hello from side effect',
  )
})

test('import glob in package', async () => {
  expect(await page.textContent('.in-package')).toBe(
    JSON.stringify(['/pkg-pages/foo.js']),
  )
})

if (!isBuild) {
  test('hmr for adding/removing files', async () => {
    const resultElement = page.locator('.result')

    addFile('dir/a.js', '')
    await expect
      .poll(async () => {
        const actualAdd = await resultElement.textContent()
        return JSON.parse(actualAdd)
      })
      .toStrictEqual({
        '/dir/a.js': {},
        ...allResult,
        '/dir/index.js': {
          ...allResult['/dir/index.js'],
          modules: {
            './a.js': {},
            ...allResult['/dir/index.js'].modules,
          },
        },
      })

    // edit the added file
    editFile('dir/a.js', () => 'export const msg ="a"')
    await expect
      .poll(async () => {
        const actualEdit = await resultElement.textContent()
        return JSON.parse(actualEdit)
      })
      .toStrictEqual({
        '/dir/a.js': {
          msg: 'a',
        },
        ...allResult,
        '/dir/index.js': {
          ...allResult['/dir/index.js'],
          modules: {
            './a.js': {
              msg: 'a',
            },
            ...allResult['/dir/index.js'].modules,
          },
        },
      })

    removeFile('dir/a.js')
    await expect
      .poll(async () => {
        const actualRemove = await resultElement.textContent()
        return JSON.parse(actualRemove)
      })
      .toStrictEqual(allResult)
  })

  test('no hmr for adding/removing files', async () => {
    let request = page.waitForResponse(/dir\/index\.js$/, { timeout: 200 })
    addFile('nohmr.js', '')
    let response = await request.catch(() => ({ status: () => -1 }))
    expect(response.status()).toBe(-1)

    request = page.waitForResponse(/dir\/index\.js$/, { timeout: 200 })
    removeFile('nohmr.js')
    response = await request.catch(() => ({ status: () => -1 }))
    expect(response.status()).toBe(-1)
  })

  test('hmr for adding/removing files in package', async () => {
    const resultElement = page.locator('.in-package')

    addFile('pkg-pages/bar.js', '// empty')
    await expect
      .poll(async () => JSON.parse(await resultElement.textContent()))
      .toStrictEqual(['/pkg-pages/foo.js', '/pkg-pages/bar.js'].sort())

    removeFile('pkg-pages/bar.js')
    await expect
      .poll(async () => JSON.parse(await resultElement.textContent()))
      .toStrictEqual(['/pkg-pages/foo.js'])
  })
}

test('tree-shake eager css', async () => {
  expect(await page.textContent('.no-tree-shake-eager-css-result')).toMatch(
    '.no-tree-shake-eager-css',
  )

  if (isBuild) {
    const content = findAssetFile(/index-[-\w]+\.js/)
    expect(content).not.toMatch('.tree-shake-eager-css')
  }
})

test('escapes special chars in globs without mangling user supplied glob suffix', async () => {
  // the escape dir contains subdirectories where each has a name that needs escaping for glob safety
  // inside each of them is a glob.js that exports the result of a relative glob `./**/*.js`
  // and an alias glob `@escape_<dirname>_mod/**/*.js`. The matching aliases are generated in vite.config.ts
  // index.html has a script that loads all these glob.js files and prints the globs that returned the expected result
  // this test finally compares the printed output of index.js with the list of directories with special chars,
  // expecting that they all work
  const files = await readdir(path.join(__dirname, '..', 'escape'), {
    withFileTypes: true,
  })
  const expectedNames = files
    .filter((f) => f.isDirectory())
    .map((f) => `/escape/${f.name}/glob.js`)
    .sort()
  const foundRelativeNames = (await page.textContent('.escape-relative'))
    .split('\n')
    .sort()
  expect(expectedNames).toEqual(foundRelativeNames)
  const foundAliasNames = (await page.textContent('.escape-alias'))
    .split('\n')
    .sort()
  expect(expectedNames).toEqual(foundAliasNames)
})

test('subpath imports', async () => {
  expect(await page.textContent('.subpath-imports')).toMatch('bar foo')
})

test('#alias imports', async () => {
  expect(await page.textContent('.hash-alias-imports')).toMatch('bar foo')
})

test('import base glob raw', async () => {
  expect(await page.textContent('.result-base')).toBe(
    JSON.stringify(baseRawResult, null, 2),
  )
})
