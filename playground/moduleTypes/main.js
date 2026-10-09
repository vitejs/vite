window.h = (tag, props, ...children) =>
  '<' + tag + '>' + children.join('') + '</' + tag + '>'

import App from './comp.jsxlabel'
import data from './data.jsonlabel'
import label from './text.label'

document.querySelector('#app').innerHTML =
  `label: ${label}\ndata: ${data.hello}\njsx: ${App()}`
