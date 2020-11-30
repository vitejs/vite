import { Plugin } from 'vite'

export const changeConfigPlugin1: Plugin = {
  changeConfig: (prev) => {
    prev.define['__changeConfigPlugin1__'] = 'success'
    prev.plugins.push(changeConfigPlugin2)
    return prev
  }
}

const changeConfigPlugin2: Plugin = {
  changeConfig: (prev) => {
    prev.define['__changeConfigPlugin2__'] = 'success'
    return prev
  }
}
