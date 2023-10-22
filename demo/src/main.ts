import MyWorker from './worker?worker&inline'

import { sharedConstant } from './shared-lib'

console.log('[MAIN THREAD] App logic', sharedConstant())

const w = new MyWorker()

w.postMessage('message_from_main_thread')
