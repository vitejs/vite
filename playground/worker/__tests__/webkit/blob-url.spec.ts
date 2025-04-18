// playground/worker/__tests__/webkit-worker.spec.ts
import { describe, expect, test } from 'vitest'
import { page } from '~utils'

describe('WebKit Worker with Blob URL', () => {
  test('should create and communicate with worker using Blob URL', async () => {
    const result = await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const blob = new Blob(['postMessage("test")'], {
          type: 'text/javascript',
        })
        const objURL = URL.createObjectURL(blob)

        try {
          const worker = new Worker(objURL)

          worker.onmessage = (e) => {
            URL.revokeObjectURL(objURL)
            resolve(e.data)
          }

          worker.onerror = (e) => {
            URL.revokeObjectURL(objURL)
            reject(e)
          }
        } catch (e) {
          URL.revokeObjectURL(objURL)
          reject(e)
        }
      })
    })

    expect(result).toBe('test')
  })

  test('should handle worker errors properly', async () => {
    const result = await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const blob = new Blob(['throw new Error("test error")'], {
          type: 'text/javascript',
        })
        const objURL = URL.createObjectURL(blob)

        try {
          const worker = new Worker(objURL)

          worker.onerror = (e) => {
            URL.revokeObjectURL(objURL)
            resolve('error handled')
          }

          worker.onmessage = () => {
            URL.revokeObjectURL(objURL)
            reject(new Error('Should not receive message'))
          }
        } catch (e) {
          URL.revokeObjectURL(objURL)
          reject(e)
        }
      })
    })

    expect(result).toBe('error handled')
  })

  // Test if URL is revoked after worker is fully loaded
  test('should revoke URL after worker is fully loaded', async () => {
    const result = await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const workerCode = `
          // Notify that worker initialization is complete
          postMessage('initializing');
          
          // Wait for messages
          self.onmessage = (e) => {
            if (e.data === 'ping') {
              postMessage('pong');
            }
          };
        `
        const blob = new Blob([workerCode], { type: 'text/javascript' })
        const objURL = URL.createObjectURL(blob)
        let isInitialized = false

        try {
          const worker = new Worker(objURL)

          worker.onmessage = (e) => {
            if (e.data === 'initializing') {
              isInitialized = true
              // Send ping message after worker initialization
              worker.postMessage('ping')
            } else if (e.data === 'pong' && isInitialized) {
              // Revoke URL after worker responds
              URL.revokeObjectURL(objURL)
              resolve(true)
            }
          }

          worker.onerror = (e) => {
            URL.revokeObjectURL(objURL)
            reject(e)
          }
        } catch (e) {
          URL.revokeObjectURL(objURL)
          reject(e)
        }
      })
    })

    expect(result).toBe(true)
  })

  // Test if URL is properly managed when worker sends multiple messages
  test('should handle multiple messages correctly', async () => {
    const result = await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const blob = new Blob(
          ['for (let i = 0; i < 3; i++) { postMessage(`message ${i}`); }'],
          { type: 'text/javascript' },
        )
        const objURL = URL.createObjectURL(blob)
        const messages = []

        try {
          const worker = new Worker(objURL)

          worker.onmessage = (e) => {
            messages.push(e.data)
            if (messages.length === 3) {
              URL.revokeObjectURL(objURL)
              resolve(messages)
            }
          }

          worker.onerror = (e) => {
            URL.revokeObjectURL(objURL)
            reject(e)
          }
        } catch (e) {
          URL.revokeObjectURL(objURL)
          reject(e)
        }
      })
    })

    expect(result).toEqual(['message 0', 'message 1', 'message 2'])
  })
})
