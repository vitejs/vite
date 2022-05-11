import {
  addFile,
  editFile,
  isBuild,
  page,
  removeFile,
  untilUpdated
} from '~utils'

const filteredResult = {
  './alias.js': {
    default: 'hi'
  },
  './foo.js': {
    msg: 'foo'
  }
}

// json exports key order is altered during build, but it doesn't matter in
// terms of behavior since module exports are not ordered anyway
const json = isBuild
  ? {
      msg: 'baz',
      default: {
        msg: 'baz'
      }
    }
  : {
      default: {
        msg: 'baz'
      },
      msg: 'baz'
    }

const globWithAlias = {
  '/dir/alias.js': {
    default: 'hi'
  }
}

const allResult = {
  // JSON file should be properly transformed
  '/dir/alias.js': {
    default: 'hi'
  },
  '/dir/baz.json': json,
  '/dir/foo.js': {
    msg: 'foo'
  },
  '/dir/index.js': isBuild
    ? {
        modules: filteredResult,
        globWithAlias
      }
    : {
        globWithAlias,
        modules: filteredResult
      },
  '/dir/nested/bar.js': {
    modules: {
      '../baz.json': json
    },
    msg: 'bar'
  }
}

const nodeModulesResult = {
  '/dir/node_modules/hoge.js': { msg: 'hoge' }
}

const rawResult = {
  '/dir/baz.json': {
    msg: 'baz'
  }
}

const relativeRawResult = {
  './dir/baz.json': {
    msg: 'baz'
  }
}

test('should work', async () => {
  expect(await page.textContent('.result')).toBe(
    JSON.stringify(allResult, null, 2)
  )
  expect(await page.textContent('.result-node_modules')).toBe(
    JSON.stringify(nodeModulesResult, null, 2)
  )
})

test('import glob raw', async () => {
  expect(await page.textContent('.globraw')).toBe(
    JSON.stringify(rawResult, null, 2)
  )
})

test('import relative glob raw', async () => {
  expect(await page.textContent('.relative-glob-raw')).toBe(
    JSON.stringify(relativeRawResult, null, 2)
  )
})

test('unassigned import processes', async () => {
  expect(await page.textContent('.side-effect-result')).toBe(
    'Hello from side effect'
  )
})

if (!isBuild) {
  test('hmr for adding/removing files', async () => {
    addFile('dir/a.js', '')
    await untilUpdated(
      () => page.textContent('.result'),
      JSON.stringify(
        {
          '/dir/a.js': {},
          ...allResult,
          '/dir/index.js': {
            ...allResult['/dir/index.js'],
            modules: {
              './a.js': {},
              ...allResult['/dir/index.js'].modules
            }
          }
        },
        null,
        2
      )
    )

    // edit the added file
    editFile('dir/a.js', () => 'export const msg ="a"')
    await untilUpdated(
      () => page.textContent('.result'),
      JSON.stringify(
        {
          '/dir/a.js': {
            msg: 'a'
          },
          ...allResult,
          '/dir/index.js': {
            ...allResult['/dir/index.js'],
            modules: {
              './a.js': {
                msg: 'a'
              },
              ...allResult['/dir/index.js'].modules
            }
          }
        },
        null,
        2
      )
    )

    removeFile('dir/a.js')
    await untilUpdated(
      () => page.textContent('.result'),
      JSON.stringify(allResult, null, 2)
    )
  })
}
