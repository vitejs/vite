import { describe, expect, test, vi } from 'vitest'

import { createLogger } from '../logger'

describe('createLogger', () => {
  test('should log [prefix] message', () => {
    const logger = createLogger('info', {
      prefix: '[prefix]',
    })
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    logger.info('message')
    // cyan color and bold
    expect(log).toHaveBeenCalledWith(
      '\u001b[36m\u001b[1m[prefix]\u001b[22m\u001b[39m message',
    )
    log.mockRestore()
  })
})
