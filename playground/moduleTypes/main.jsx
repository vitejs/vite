import { createRoot } from 'react-dom/client'
import App from './comp.jsxlabel'
import data, { hello } from './data.jsonlabel'
import label from './text.label'
import nodot from './text.nodot'

document.querySelector('#app').innerHTML =
  `label: ${label}\nnodot: ${nodot}\ndata: ${data.hello}\nnamed: ${hello}\njsx: <div id="jsx-root"></div>`
createRoot(document.getElementById('jsx-root')).render(<App />)
