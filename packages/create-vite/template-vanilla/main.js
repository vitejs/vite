import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.js'

const getElement = document.getElementById.bind(document)

getElement('javascriptLogo').src = javascriptLogo
getElement('viteLogo').src = viteLogo
setupCounter(getElement('counter'))
