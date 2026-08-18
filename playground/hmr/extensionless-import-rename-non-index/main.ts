import { msg } from './Foo/bar'

const el = document.querySelector('.extensionless-import-rename-non-index')!
el.textContent = msg

if (import.meta.hot) {
  import.meta.hot.accept('./Foo/bar', ({ msg }) => {
    el.textContent = msg
  })
}
