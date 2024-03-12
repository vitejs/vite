import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.js'

const $ = document.getElementById.bind(document)

$('viteLogo').src = viteLogo
$('javascriptLogo').src = javascriptLogo
setupCounter($('counter'))
