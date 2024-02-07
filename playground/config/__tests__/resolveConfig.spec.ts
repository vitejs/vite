import { createLogger, normalizePath, resolveConfig } from 'vite'
import { expect, it } from 'vitest'

const normalizeString = (str: string) => {
  const myRoot = normalizePath(process.cwd())
  // eslint-disable-next-line no-control-regex
  str = str.replace(/\x1b\[[\d;]+m/gi, '').replace(myRoot, '')
  return str
}

it('resolveConfig with root path including both "#" and "?" should warn for both charchters ', async () => {
  const logger = createLogger('info')
  logger.warn = (str) => {
    expect(normalizeString(str)).toEqual(
      'The project root contains the "#" and "?" characters (/inc?ud#s), ' +
        'which may not work when running Vite. Consider renaming the ' +
        'directory to remove the "#" and "?" characters.',
    )
  }

  await resolveConfig({ root: './inc?ud#s', customLogger: logger }, 'build')

  expect.assertions(1)
})

it('resolveConfig with root path including "#" should warn accordingly ', async () => {
  const logger = createLogger('info')
  logger.warn = (str) => {
    expect(normalizeString(str)).toEqual(
      'The project root contains the "#" character (/includ#s), which may ' +
        'not work when running Vite. Consider renaming the directory to ' +
        'remove the "#" character.',
    )
  }

  await resolveConfig({ root: './includ#s', customLogger: logger }, 'build')

  expect.assertions(1)
})

it('resolveConfig with root path including "?" should warn accordingly ', async () => {
  const logger = createLogger('info')
  logger.warn = (str) => {
    expect(normalizeString(str)).toEqual(
      'The project root contains the "?" character (/inc?udes), which may ' +
        'not work when running Vite. Consider renaming the directory to ' +
        'remove the "?" character.',
    )
  }

  await resolveConfig({ root: './inc?udes', customLogger: logger }, 'build')

  expect.assertions(1)
})
