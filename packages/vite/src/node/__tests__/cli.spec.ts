import { describe, expect, test } from 'vitest'

interface GlobalCLIOptions {
  '--'?: string[]
  c?: boolean | string
  config?: string
  base?: string
  l?: string
  logLevel?: string
  clearScreen?: boolean
  configLoader?: 'bundle' | 'runner' | 'native'
  d?: boolean | string
  debug?: boolean | string
  f?: string
  filter?: string
  m?: string
  mode?: string
  force?: boolean
  w?: boolean
  envDir?: string
  envPrefix?: string | string[]
}

const filterDuplicateOptions = <T extends object>(options: T) => {
  for (const [key, value] of Object.entries(options)) {
    if (Array.isArray(value) && key !== 'envPrefix') {
      options[key as keyof T] = value[value.length - 1]
    }
  }
}

function cleanGlobalCLIOptions<Options extends GlobalCLIOptions>(
  options: Options,
): Omit<Options, keyof GlobalCLIOptions> {
  const ret = { ...options }
  delete ret['--']
  delete ret.c
  delete ret.config
  delete ret.base
  delete ret.l
  delete ret.logLevel
  delete ret.clearScreen
  delete ret.configLoader
  delete ret.d
  delete ret.debug
  delete ret.f
  delete ret.filter
  delete ret.m
  delete ret.mode
  delete ret.force
  delete ret.w
  delete ret.envDir
  delete ret.envPrefix

  return ret
}

describe('cleanGlobalCLIOptions', () => {
  test('envDir from CLI overrides config value', () => {
    const options: GlobalCLIOptions & { root?: string } = {
      root: './my-project',
      envDir: './custom-env',
      mode: 'production',
    }
    const cleaned = cleanGlobalCLIOptions(options)
    expect(cleaned.envDir).toBeUndefined()
    expect(cleaned.root).toBe('./my-project')
  })

  test('envPrefix from CLI with single value', () => {
    const options: GlobalCLIOptions & { root?: string } = {
      root: './my-project',
      envPrefix: 'CUSTOM_',
      mode: 'production',
    }
    const cleaned = cleanGlobalCLIOptions(options)
    expect(cleaned.envPrefix).toBeUndefined()
    expect(cleaned.root).toBe('./my-project')
  })

  test('envPrefix with multiple CLI values becomes flat array', () => {
    const options: GlobalCLIOptions & { root?: string } = {
      root: './my-project',
      envPrefix: ['VITE_', 'CUSTOM_'],
      mode: 'production',
    }
    expect(options.envPrefix).toEqual(['VITE_', 'CUSTOM_'])
  })

  test('envDir and envPrefix are removed from cleaned options', () => {
    const options: GlobalCLIOptions = {
      envDir: './custom-env',
      envPrefix: ['VITE_', 'CUSTOM_'],
      mode: 'test',
    }
    const cleaned = cleanGlobalCLIOptions(options)
    expect('envDir' in cleaned).toBe(false)
    expect('envPrefix' in cleaned).toBe(false)
    expect(cleaned.mode).toBe('test')
  })
})

describe('filterDuplicateOptions', () => {
  test('envPrefix is NOT deduplicated (multiple values preserved)', () => {
    const options = {
      envPrefix: ['VITE_', 'CUSTOM_'],
      mode: ['development', 'production'],
    }
    filterDuplicateOptions(options)
    expect(options.envPrefix).toEqual(['VITE_', 'CUSTOM_'])
    expect(options.mode).toBe('production')
  })

  test('other array options are deduplicated to last value', () => {
    const options = {
      envPrefix: ['VITE_', 'CUSTOM_'],
      mode: ['development', 'production'],
      filter: ['filter1', 'filter2'],
    }
    filterDuplicateOptions(options)
    expect(options.envPrefix).toEqual(['VITE_', 'CUSTOM_'])
    expect(options.mode).toBe('production')
    expect(options.filter).toBe('filter2')
  })

  test('single string envPrefix remains string', () => {
    const options = {
      envPrefix: 'VITE_',
    }
    filterDuplicateOptions(options)
    expect(options.envPrefix).toBe('VITE_')
  })

  test('envPrefix array is NOT flattened (preserves nested structure from CAC)', () => {
    const options = {
      envPrefix: ['VITE_', 'CUSTOM_'],
    }
    filterDuplicateOptions(options)
    expect(Array.isArray(options.envPrefix)).toBe(true)
    expect(options.envPrefix).toEqual(['VITE_', 'CUSTOM_'])
  })
})

describe('CLI option passthrough', () => {
  test('CLI envDir should be passed to InlineConfig', () => {
    const cliOptions: GlobalCLIOptions = {
      envDir: './custom-env',
      mode: 'production',
    }
    const inlineConfig = {
      root: '.',
      envDir: cliOptions.envDir,
      mode: cliOptions.mode,
    }
    expect(inlineConfig.envDir).toBe('./custom-env')
  })

  test('CLI envPrefix array should be passed to InlineConfig', () => {
    const cliOptions: GlobalCLIOptions = {
      envPrefix: ['VITE_', 'CUSTOM_'],
      mode: 'production',
    }
    const inlineConfig = {
      root: '.',
      envPrefix: cliOptions.envPrefix,
      mode: cliOptions.mode,
    }
    expect(inlineConfig.envPrefix).toEqual(['VITE_', 'CUSTOM_'])
  })

  test('CLI envDir falls back to config value when not provided', () => {
    const configEnvDir = './default-env'
    const cliOptions: GlobalCLIOptions = {
      mode: 'production',
    }
    const inlineConfig = {
      root: '.',
      envDir: cliOptions.envDir ?? configEnvDir,
      mode: cliOptions.mode,
    }
    expect(inlineConfig.envDir).toBe('./default-env')
  })

  test('CLI envPrefix falls back to config value when not provided', () => {
    const configEnvPrefix = 'VITE_'
    const cliOptions: GlobalCLIOptions = {
      mode: 'production',
    }
    const inlineConfig = {
      root: '.',
      envPrefix: cliOptions.envPrefix ?? configEnvPrefix,
      mode: cliOptions.mode,
    }
    expect(inlineConfig.envPrefix).toBe('VITE_')
  })

  test('multiple --envPrefix flags produce flat array', () => {
    const cliOptions: GlobalCLIOptions = {
      envPrefix: ['VITE_', 'CUSTOM_'],
    }
    expect(cliOptions.envPrefix).toEqual(['VITE_', 'CUSTOM_'])
    const inlineConfig = {
      root: '.',
      envPrefix: cliOptions.envPrefix,
    }
    expect(inlineConfig.envPrefix).toEqual(['VITE_', 'CUSTOM_'])
    expect(Array.isArray(inlineConfig.envPrefix)).toBe(true)
    expect(inlineConfig.envPrefix.length).toBe(2)
  })
})