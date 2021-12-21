import { join, relative, resolve } from 'path'
import type { SymlinkResolver } from '../symlinks'
import { createSymlinkResolver } from '../symlinks'

let resolver: SymlinkResolver

const realpathMock = jest.fn()
const readlinkMock = jest.fn()

const root = '/dev/root'
const realpathSync = (p: string) => {
  return resolver.realpathSync(resolve(root, p))
}

describe('SymlinkResolver', () => {
  beforeEach(() => {
    mockRealPath({})
    mockReadLink({})
    resolver = createSymlinkResolver(root, {
      realpathSync: { native: realpathMock },
      readlinkSync: readlinkMock
    })
  })

  describe('inside project root', () => {
    test('no symlinks present', () => {
      const result = realpathSync('foo/bar')
      expect(result).toMatchInlineSnapshot(`"/dev/root/foo/bar"`)
      expect(resolver.fsCalls).toMatchInlineSnapshot(`2`)
      expect(resolver.cacheHits).toMatchInlineSnapshot(`0`)

      // …is cached?
      expect(realpathSync('foo/bar')).toBe(result)
      expect(resolver.fsCalls).toMatchInlineSnapshot(`2`)
      expect(resolver.cacheHits).toMatchInlineSnapshot(`1`)
    })

    test('given path is a symlink', () => {
      mockReadLink({ 'foo/bar': './baz' })

      const result = realpathSync('foo/bar')
      expect(result).toMatchInlineSnapshot(`"/dev/root/foo/baz"`)
      expect(resolver.fsCalls).toMatchInlineSnapshot(`3`)
      expect(resolver.cacheHits).toMatchInlineSnapshot(`0`)

      // …is cached?
      expect(realpathSync('foo/bar')).toBe(result)
      expect(resolver.fsCalls).toMatchInlineSnapshot(`3`)
      expect(resolver.cacheHits).toMatchInlineSnapshot(`1`)
    })

    test('given path is a symlink pointing out of root', () => {
      mockReadLink({ foo: '/dev/foo' })

      const result = realpathSync('foo')
      expect(result).toMatchInlineSnapshot(`"/dev/foo"`)
      expect(resolver.fsCalls).toMatchInlineSnapshot(`4`)
      expect(resolver.cacheHits).toMatchInlineSnapshot(`0`)

      // …is cached?
      expect(realpathSync('foo')).toBe(result)
      expect(resolver.fsCalls).toMatchInlineSnapshot(`4`)
      expect(resolver.cacheHits).toMatchInlineSnapshot(`1`)
    })

    test('given path is a symlink within a symlink', () => {
      mockRealPath({ foo: 'red' })
      mockReadLink({ 'red/bar': './baz' })

      const result = realpathSync('foo/bar')
      expect(result).toMatchInlineSnapshot(`"/dev/root/red/baz"`)
      expect(resolver.fsCalls).toMatchInlineSnapshot(`3`)
      expect(resolver.cacheHits).toMatchInlineSnapshot(`0`)

      // …is cached?
      expect(realpathSync('foo/bar')).toBe(result)
      expect(resolver.fsCalls).toMatchInlineSnapshot(`3`)
      expect(resolver.cacheHits).toMatchInlineSnapshot(`1`)
    })

    test('given path has symlink grand parent', () => {
      mockRealPath({ 'foo/bar': 'red/bar' })

      const result = realpathSync('foo/bar/main.js')
      expect(result).toMatchInlineSnapshot(`"/dev/root/red/bar/main.js"`)
      expect(resolver.fsCalls).toMatchInlineSnapshot(`2`)
      expect(resolver.cacheHits).toMatchInlineSnapshot(`0`)

      // …is cached?
      expect(realpathSync('foo/bar/main.js')).toBe(result)
      expect(realpathSync('foo/bar')).toMatchInlineSnapshot(
        `"/dev/root/red/bar"`
      )
      expect(resolver.fsCalls).toMatchInlineSnapshot(`2`)
      expect(resolver.cacheHits).toMatchInlineSnapshot(`2`)
    })

    test('given path has two symlink parents', () => {
      mockRealPath({ 'foo/bar': 'red/blue' })

      const result = realpathSync('foo/bar/main.js')
      expect(result).toMatchInlineSnapshot(`"/dev/root/red/blue/main.js"`)
      expect(resolver.fsCalls).toMatchInlineSnapshot(`2`)
      expect(resolver.cacheHits).toMatchInlineSnapshot(`0`)

      // …is cached?
      expect(realpathSync('foo/bar/main.js')).toBe(result)
      expect(realpathSync('foo/bar')).toMatchInlineSnapshot(
        `"/dev/root/red/blue"`
      )
      expect(realpathSync('foo')).toMatchInlineSnapshot(`"/dev/root/red"`)
      expect(resolver.fsCalls).toMatchInlineSnapshot(`2`)
      expect(resolver.cacheHits).toMatchInlineSnapshot(`3`)
    })
  })

  test('symlink outside project root', () => {
    // Mock a symlink that points to another symlink.
    mockReadLink({ '../foo': './bar', '../bar': './baz' })

    const result = realpathSync('../foo')
    expect(result).toMatchInlineSnapshot(`"/dev/baz"`)
    expect(resolver.fsCalls).toMatchInlineSnapshot(`4`)
    expect(resolver.cacheHits).toMatchInlineSnapshot(`0`)

    // …is cached?
    expect(realpathSync('../foo')).toBe(result)
    expect(realpathSync('../bar')).toMatchInlineSnapshot(`"/dev/baz"`)
    expect(realpathSync('../baz')).toMatchInlineSnapshot(`"/dev/baz"`)
    expect(resolver.fsCalls).toMatchInlineSnapshot(`4`)
    expect(resolver.cacheHits).toMatchInlineSnapshot(`3`)
  })
})

function mockRealPath(pathMap: Record<string, string>) {
  realpathMock.mockReset()
  realpathMock.mockImplementation((arg) => {
    return resolve(root, pathMap[relative(root, arg)] || arg)
  })
}

// Thrown by fs.readlinkSync if given a path that's not a symlink.
const throwInvalid = throwError(-22)

function mockReadLink(linkMap: Record<string, string>) {
  readlinkMock.mockReset()
  readlinkMock.mockImplementation((arg) => {
    return linkMap[relative(root, arg)] || throwInvalid()
  })
}

function throwError(errno: number) {
  return () => {
    const e: any = new Error()
    e.errno = errno
    throw e
  }
}
