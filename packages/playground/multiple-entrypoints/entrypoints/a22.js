import a23 from './a23'
import a24 from './a24'

export const that = () => import('./a21.js')

export function other() {
  return a23() + a24()
}

export default function () {
  return 123
}
