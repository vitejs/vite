import { msg as msgJs } from './hello.js'
import { msgCjs } from './hellocjs.cjs'
import { msgJsx } from './hellojsx.jsx'
import { msgMjs } from './hellomjs.mjs'
import { msgTsx } from './hellotsx.js'

export const msg =
  msgJs && msgJsx && msgTsx && msgCjs && msgMjs
    ? '[success] use .js / .jsx / .cjs / .mjs extension to import a TS modules'
    : '[fail]'
