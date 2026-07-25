import '@qwik.dev/core/qwikloader.js'

import { render } from '@qwik.dev/core'
import './index.css'
import { App } from './app.tsx'

render(document.getElementById('app') as HTMLElement, <App />)
