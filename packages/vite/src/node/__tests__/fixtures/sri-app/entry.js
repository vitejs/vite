import { msg } from './shared.js'
import logoUrl from './logo.png'
import './style.css'

const dynamic = () => import('./dynamic.js')

console.log(msg, logoUrl, dynamic)
