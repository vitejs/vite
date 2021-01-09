import { isBuild } from '../../testUtils'

const filteredResult = {
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

const allResult = {
  // JSON file should be properly transformed
  './dir/baz.json': json,
  './dir/foo.js': {
    msg: 'foo'
  },
  './dir/index.js': {
    default: filteredResult
  },
  './dir/nested/bar.js': {
    msg: 'bar'
  }
}

test('all', async () => {
  expect(await page.textContent('.all')).toBe(
    JSON.stringify(allResult, null, 2)
  )
})

test('filtered', async () => {
  expect(await page.textContent('.filtered')).toBe(
    JSON.stringify(filteredResult, null, 2)
  )
})
