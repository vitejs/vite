import { expect, test } from 'vitest'
import { stripNesting } from '../ssrExternal'

test('stripNesting', async () => {
  expect(stripNesting(['c', 'p1>c1', 'p2 > c2'])).toEqual(['c', 'c1', 'c2'])
})
