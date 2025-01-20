import { msg as msgJs } from './hello.js'
import { msgJsx } from './hellojsx.jsx'
import { msgTsx } from './hellotsx.js'
import { msgCjs } from './hellocjs.cjs'
import { msgMjs } from './hellomjs.mjs'

export const msg =
  msgJs && msgJsx && msgTsx && msgCjs && msgMjs
    ? '[success] use .js / .jsx / .cjs / .mjs extension to import a TS modules'
    : '[fail]'
