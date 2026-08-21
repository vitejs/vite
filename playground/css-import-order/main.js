import { vendor } from './vendor.js'
import './override.css'

document.querySelector('#app').innerHTML =
  `<div class="box">main ${vendor}</div>`
