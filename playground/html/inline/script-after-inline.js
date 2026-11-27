window.inlineScriptOrder.push('after')
document.querySelector('#inline-order').textContent =
  window.inlineScriptOrder.join(',')
