import { sharedConstant } from './shared-lib'

console.log('[WORKER THREAD] Worker logic', sharedConstant())

self.onmessage = function (message) {
  console.log('[WORKER THREAD] Got message', message.data)
}
