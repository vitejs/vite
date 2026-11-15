import { DceTestSharedNestedWorker } from './dce-test-shared-importer.js'

new DceTestSharedNestedWorker()
self.postMessage('dce-test-shared-worker is live')
