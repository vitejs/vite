import { dep } from './dep.js'

export const app = () => dep

if (import.meta.hot) {
  import.meta.hot.accept()
}
