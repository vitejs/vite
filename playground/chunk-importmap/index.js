import './static.js'
import('./dynamic.js')

import myWorker from './worker.js?worker'

document.querySelector('.js').textContent = 'js: ok'

document.querySelector('.importmap').textContent = JSON.stringify(
  JSON.parse(
    document.head.querySelector('script[type="importmap"]')?.textContent,
  ),
  null,
  2,
)

const worker = new myWorker()
worker.postMessage('ping')
worker.addEventListener('message', (e) => {
  document.querySelector('.worker').textContent = e.data.message
})
