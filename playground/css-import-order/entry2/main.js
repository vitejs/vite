// Mirrors ../main.js so the two entries share a chunk and exercise the
// multi-entry pure-CSS-absorption ordering path.
import { vendor } from '../vendor.js'
import '../override.css'

document.querySelector('#app').innerHTML =
  `<div class="box">entry2 ${vendor}</div>`
