import { describe, expect, test, vi } from 'vitest'

import { createLogger } from '../logger'

describe('createLogger', () => {
  test('should log [prefix] message', () => {
    const logger = createLogger('info', {
      prefix: '[prefix]',
    })
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    logger.info('message')
    expect(log).toHaveBeenCalledWith('[prefix] message')

    log.mockRestore()
  })
})
