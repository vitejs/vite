import MyWorker from './worker?worker'

const run = async () => {
  const worker = new MyWorker()
  worker.postMessage('ping')
}

run()
