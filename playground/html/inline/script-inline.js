import './script-inline-dependency.js'

window.inlineScriptOrder.push('inline')
document.querySelector('#inline-order').textContent =
  window.inlineScriptOrder.join(',')
