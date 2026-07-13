import { value } from './invalidation-child.js'

import.meta.hot?.accept()

document.querySelector('.invalidation-parent').textContent = value
