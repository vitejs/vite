import { describe } from './dep.js'

export const name = 'entry'

document.querySelector('.entry-cycle-display').textContent = describe()
