import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { checkNodeVersion } from '../cli'

describe('CLI Node.js version checking', () => {
  let originalNodeVersion: string
  let consoleSpy: any

  beforeEach(() => {
    originalNodeVersion = process.versions.node
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    // Restore original version
    Object.defineProperty(process.versions, 'node', {
      value: originalNodeVersion,
      writable: true,
    })
    consoleSpy.mockRestore()
  })

  function mockNodeVersion(version: string) {
    Object.defineProperty(process.versions, 'node', {
      value: version,
      writable: true,
    })
  }

  test('should warn for Node.js version < 20.19.0', () => {
    mockNodeVersion('18.20.0')

    checkNodeVersion()

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('You are using Node.js 18.20.0'),
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Vite requires Node.js version 20.19+ or 22.12+'),
    )
  })

  test('should warn for Node.js version 20.18.x', () => {
    mockNodeVersion('20.18.5')

    checkNodeVersion()

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('You are using Node.js 20.18.5'),
    )
  })

  test('should warn for Node.js version 22.11.x', () => {
    mockNodeVersion('22.11.0')

    checkNodeVersion()

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('You are using Node.js 22.11.0'),
    )
  })

  test('should not warn for Node.js version 20.19.0', () => {
    mockNodeVersion('20.19.0')

    checkNodeVersion()

    expect(consoleSpy).not.toHaveBeenCalled()
  })

  test('should not warn for Node.js version 20.20.x', () => {
    mockNodeVersion('20.20.1')

    checkNodeVersion()

    expect(consoleSpy).not.toHaveBeenCalled()
  })

  test('should not warn for Node.js version 22.12.0', () => {
    mockNodeVersion('22.12.0')

    checkNodeVersion()

    expect(consoleSpy).not.toHaveBeenCalled()
  })

  test('should not warn for Node.js version 22.13.x', () => {
    mockNodeVersion('22.13.1')

    checkNodeVersion()

    expect(consoleSpy).not.toHaveBeenCalled()
  })

  test('should not warn for Node.js version 23.x.x', () => {
    mockNodeVersion('23.0.0')

    checkNodeVersion()

    expect(consoleSpy).not.toHaveBeenCalled()
  })
})
