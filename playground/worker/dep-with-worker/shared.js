export function sharedBetweenWorkerAndMain(el, text) {
  if ('WorkerGlobalScope' in globalThis) {
    self.postMessage({ msg: text })
  } else if (document.querySelector(el).textContent.length > 0) {
    document.querySelector(el).textContent += '\n' + text
  } else {
    document.querySelector(el).textContent = text
  }
}
