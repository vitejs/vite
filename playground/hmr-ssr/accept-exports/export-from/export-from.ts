import { a } from './hub'

log(a)

if (import.meta.hot) {
  import.meta.hot.accept()
} else {
}
