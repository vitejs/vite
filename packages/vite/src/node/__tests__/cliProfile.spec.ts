import { describe, expect, test } from 'vitest'
import { removeProfileFlag } from '../../../bin/profile.js'

describe('profile cli flag', () => {
  test('removes --profile without removing the root argument', () => {
    const argv = ['node', 'vite', 'build', '--profile', 'app']

    expect(removeProfileFlag(argv)).toBe(3)
    expect(argv).toEqual(['node', 'vite', 'build', 'app'])
  })

  test('removes --profile without removing the command argument', () => {
    const argv = ['node', 'vite', '--profile', 'build']

    expect(removeProfileFlag(argv)).toBe(2)
    expect(argv).toEqual(['node', 'vite', 'build'])
  })
})
