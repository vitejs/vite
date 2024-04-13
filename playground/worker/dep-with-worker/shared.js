export function sharedBetweenWorkerAndMain(el, text) {
  if (self && self.postMessage) {
    self.postMessage({ msg: text })
  } else if (document.querySelector(el).textContent.length) {
    document.querySelector(el).textContent += '\n' + text
  } else {
    document.querySelector(el).textContent += text
  }
}
