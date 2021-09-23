import { findCompilerOption } from './tsconfig'
import * as fs from './fs'

jest.mock('./fs')

const readJsonFile = fs.readJsonFile as jest.Mock

describe('findCompilerOption', () => {
  afterEach(() => {
    readJsonFile.mockReset()
  })

  it('finds the nearest tsconfig.json', () => {
    findCompilerOption('/a/b/c.ts', 'foo')
    expect(readJsonFile.mock.calls).toEqual([
      ['/a/b/tsconfig.json'],
      ['/a/tsconfig.json'],
      ['/tsconfig.json']
    ])
  })

  it('searches the "extends" chain', () => {
    const files = {
      '/a/b/tsconfig.json': { extends: '../../tsconfig.json' },
      '/tsconfig.json': { compilerOptions: { foo: 1 } }
    }
    readJsonFile.mockImplementation((file) => files[file])
    expect(findCompilerOption('/a/b/c.ts', 'foo')).toBe(1)
  })

  it('stops looking on first defined value', () => {
    const files = {
      '/a/b/tsconfig.json': {
        extends: '../tsconfig.json'
      },
      '/a/tsconfig.json': {
        extends: '../tsconfig.json',
        compilerOptions: { foo: 1 }
      },
      '/tsconfig.json': {
        compilerOptions: { foo: 2 }
      }
    }
    readJsonFile.mockImplementation((file) => files[file])
    expect(findCompilerOption('/a/b/c.ts', 'foo')).toBe(1)
  })

  it('works with Windows paths', () => {
    findCompilerOption('C:\\a\\b\\c.ts', 'foo')
    expect(readJsonFile.mock.calls).toEqual([
      ['C:\\a\\b\\tsconfig.json'],
      ['C:\\a\\tsconfig.json'],
      ['C:\\tsconfig.json']
    ])
  })
})
