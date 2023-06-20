import './index.css'
import { message } from './message2.js'
export default function myLib(sel) {
  document.querySelector(sel).textContent = `It works<br/>${message}`
}
