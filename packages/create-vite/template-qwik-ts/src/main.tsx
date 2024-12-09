import '@builder.io/qwik/qwikloader.js'

import { render } from '@builder.io/qwik'
import './index.css'
import { App } from './app.tsx'

render(document.getElementById('app') as HTMLElement, <App />)
