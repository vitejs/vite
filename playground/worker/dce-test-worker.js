import DceTestNestedWorker from './dce-test-nested-worker.js?worker'

const _nested = new DceTestNestedWorker()
self.postMessage('dce-test-worker should be tree-shaken')
