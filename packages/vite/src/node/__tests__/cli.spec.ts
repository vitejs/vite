import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { checkNodeVersion } from '../cli'

describe('CLI Node.js version checking', () => {
  let originalNodeVersion: string

  beforeEach(() => {
    originalNodeVersion = process.versions.node
  })

  afterEach(() => {
    // Restore original version
    Object.defineProperty(process.versions, 'node', {
      value: originalNodeVersion,
      writable: true,
    })
  })

  function mockNodeVersion(version: string) {
    Object.defineProperty(process.versions, 'node', {
      value: version,
      writable: true,
    })
  }

  test('should return false for Node.js version < 20.19.0', () => {
    mockNodeVersion('18.20.0')

    const result = checkNodeVersion()

    expect(result).toBe(false)
  })

  test('should return false for Node.js version 20.18.x', () => {
    mockNodeVersion('20.18.5')

    const result = checkNodeVersion()

    expect(result).toBe(false)
  })

  test('should return false for Node.js version 22.11.x', () => {
    mockNodeVersion('22.11.0')

    const result = checkNodeVersion()

    expect(result).toBe(false)
  })

  test('should return true for Node.js version 20.19.0', () => {
    mockNodeVersion('20.19.0')

    const result = checkNodeVersion()

    expect(result).toBe(true)
  })

  test('should return true for Node.js version 20.20.x', () => {
    mockNodeVersion('20.20.1')

    const result = checkNodeVersion()

    expect(result).toBe(true)
  })

  test('should return true for Node.js version 22.12.0', () => {
    mockNodeVersion('22.12.0')

    const result = checkNodeVersion()

    expect(result).toBe(true)
  })

  test('should return true for Node.js version 22.13.x', () => {
    mockNodeVersion('22.13.1')

    const result = checkNodeVersion()

    expect(result).toBe(true)
  })

  test('should return true for Node.js version 23.x.x', () => {
    mockNodeVersion('23.0.0')

    const result = checkNodeVersion()

    expect(result).toBe(true)
  })
})
