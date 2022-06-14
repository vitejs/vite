import a24 from './a24'

export const that = () => import('./a22.js')

export function other() {
  return a24()
}

export default function () {
  return 123
}
