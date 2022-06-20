import { a } from './hub'

console.log(a)

if (import.meta.hot) {
  import.meta.hot.accept()
} else {
}
