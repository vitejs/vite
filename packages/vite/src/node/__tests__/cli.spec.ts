import { describe, expect, test } from 'vitest'
import { checkNodeVersion } from '../cli'

describe('CLI Node.js version checking', () => {
  test.each([
    // Unsupported versions
    ['18.20.0', false],
    ['20.18.5', false],
    ['22.11.0', false],
    // Supported versions
    ['20.19.0', true],
    ['20.20.1', true],
    ['22.12.0', true],
    ['22.13.1', true],
    ['23.0.0', true],
  ])('should return %p for Node.js version %s', (version, expected) => {
    const result = checkNodeVersion(version)
    expect(result).toBe(expected)
  })
})
