import { createRoot } from 'react-dom/client'
import App from './comp.jsxlabel'
import data from './data.jsonlabel'
import label from './text.label'

document.querySelector('#app').innerHTML =
  `label: ${label}\ndata: ${data.hello}\njsx: <div id="jsx-root"></div>`
createRoot(document.getElementById('jsx-root')).render(<App />)
